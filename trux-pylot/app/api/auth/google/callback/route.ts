import { NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createSession, dashboardPath, createAuthChallenge } from '@/lib/auth';
import { createDeviceToken, ensureDevice, deviceHash, recordLoginAttempt } from '@/lib/security';

const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
function secret(){return new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-change-me');}
function appUrl(){return (process.env.NEXT_PUBLIC_APP_URL || 'https://trux-pylot.onrender.com').replace(/\/$/,'');}
export async function GET(request:Request){
  const url=new URL(request.url); const code=url.searchParams.get('code'); const state=url.searchParams.get('state'); const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)tp_google_state=([^;]+)/)?.[1];
  if(!code||!state||!cookie||state!==cookie) return NextResponse.redirect(new URL('/login?google=invalid',request.url));
  const clientId=process.env.GOOGLE_CLIENT_ID, clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret) return NextResponse.redirect(new URL('/login?google=not-configured',request.url));
  try{
    await jwtVerify(state,secret());
    const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:`${appUrl()}/api/auth/google/callback`,grant_type:'authorization_code'})});
    const tokens=await tokenRes.json() as {id_token?:string}; if(!tokenRes.ok||!tokens.id_token) throw new Error('Google token exchange failed');
    const verified=await jwtVerify(tokens.id_token,googleKeys,{issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId});
    const payload=verified.payload; const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():''; const sub=typeof payload.sub==='string'?payload.sub:''; const name=typeof payload.name==='string'?payload.name:'Google user';
    if(!email||!sub||payload.email_verified!==true) return NextResponse.redirect(new URL('/login?google=email-not-verified',request.url));
    let user=await prisma.user.findFirst({where:{OR:[{googleSubject:sub},{email}]}});
    if(user){
      if(user.status!=='ACTIVE') return NextResponse.redirect(new URL('/login?blocked=1',request.url));
      if(!user.googleSubject) await prisma.user.update({where:{id:user.id},data:{googleSubject:sub,authProvider:'google'}});
      const deviceToken=request.headers.get('cookie')?.match(/(?:^|;\s*)tp_device=([^;]+)/)?.[1]||createDeviceToken(); const device=await ensureDevice(user.id,deviceToken,request); await recordLoginAttempt({userId:user.id,email:user.email,action:'LOGIN_GOOGLE',success:true,riskLevel:device.isNew?'MEDIUM':'NORMAL',request,deviceFingerprint:deviceHash(deviceToken)});
      const security=await prisma.securityProfile.findUnique({where:{userId:user.id},select:{twoFactorEnabled:true}}); if(security?.twoFactorEnabled){const challenge=await createAuthChallenge({userId:user.id,role:user.role,email:user.email,purpose:'LOGIN_2FA'});const response=NextResponse.redirect(new URL('/login?google=2fa',request.url));response.cookies.set('tp_auth_challenge',challenge,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});response.cookies.set('tp_device',deviceToken,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:31536000});return response;} const session=await createSession({userId:user.id,role:user.role,email:user.email,deviceId:device.id,twoFactorVerified:false}); const response=NextResponse.redirect(new URL(dashboardPath(user.role),request.url)); response.cookies.set('tp_session',session,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:604800}); response.cookies.set('tp_device',deviceToken,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:31536000}); response.cookies.delete('tp_google_state'); return response;
    }
    const pending=await new (await import('jose')).SignJWT({email,sub,name}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('10m').sign(secret());
    const response=NextResponse.redirect(new URL('/register?google=1',request.url)); response.cookies.set('tp_google_pending',pending,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600}); response.cookies.delete('tp_google_state'); return response;
  }catch(error){console.error('[google/callback]',error instanceof Error?error.message:error);return NextResponse.redirect(new URL('/login?google=failed',request.url));}
}
