import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { randomBytes } from 'crypto';

function secret(){return new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-change-me');}
function appUrl(){return (process.env.NEXT_PUBLIC_APP_URL || 'https://trux-pylot.onrender.com').replace(/\/$/,'');}
export async function GET(request: Request){
  const clientId=process.env.GOOGLE_CLIENT_ID;
  if(!clientId) return NextResponse.redirect(new URL('/login?google=not-configured',request.url));
  const state=await new SignJWT({nonce:randomBytes(16).toString('hex')}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('10m').sign(secret());
  const response=NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({client_id:clientId,redirect_uri:`${appUrl()}/api/auth/google/callback`,response_type:'code',scope:'openid email profile',state,access_type:'online',prompt:'select_account'}).toString()}`);
  response.cookies.set('tp_google_state',state,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});
  return response;
}
