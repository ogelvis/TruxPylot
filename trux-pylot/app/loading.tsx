export default function Loading() {
  return (
    <main className="tp-app-loading" aria-label="Loading TruxPylot" role="status">
      <div className="tp-loading-orbit tp-loading-orbit-one" />
      <div className="tp-loading-orbit tp-loading-orbit-two" />
      <div className="tp-loading-glow" />
      <div className="tp-loading-content">
        <div className="tp-loading-logo-wrap">
          <img src="/trux-pylot-logo.png" alt="Trux Pylot" className="tp-loading-logo" />
        </div>
        <div className="tp-loading-bar" aria-hidden="true"><span /></div>
        <p>Preparing your TruxPylot experience</p>
      </div>
      <style jsx>{`
        .tp-app-loading{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;background:#073fc8;color:#fff;font-family:Arial,Helvetica,sans-serif}
        .tp-loading-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px}
        .tp-loading-logo-wrap{display:flex;align-items:center;justify-content:center;width:min(260px,70vw);min-height:92px;padding:12px 18px;background:#fff;border-radius:20px;box-shadow:0 22px 55px rgba(0,0,0,.2);animation:tp-logo-in .55s ease-out both}
        .tp-loading-logo{display:block;width:100%;max-width:220px;height:auto;max-height:90px;object-fit:contain}
        .tp-loading-bar{width:170px;height:4px;margin-top:25px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.2)}
        .tp-loading-bar span{display:block;width:45%;height:100%;border-radius:inherit;background:#fff;animation:tp-loading-progress 1.15s ease-in-out infinite}
        .tp-loading-content p{margin:12px 0 0;color:rgba(255,255,255,.78);font-size:12px;letter-spacing:.3px}
        .tp-loading-orbit{position:absolute;border:1px solid rgba(255,255,255,.13);border-radius:50%;animation:tp-orbit 8s linear infinite}
        .tp-loading-orbit-one{width:520px;height:520px}.tp-loading-orbit-two{width:760px;height:760px;animation-duration:13s;animation-direction:reverse}
        .tp-loading-glow{position:absolute;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.08);filter:blur(30px);animation:tp-glow 2.4s ease-in-out infinite}
        @keyframes tp-logo-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes tp-loading-progress{0%{transform:translateX(-120%)}50%{transform:translateX(130%)}100%{transform:translateX(300%)}}
        @keyframes tp-orbit{to{transform:rotate(360deg)}}
        @keyframes tp-glow{0%,100%{transform:scale(.85);opacity:.5}50%{transform:scale(1.1);opacity:1}}
        @media(max-width:600px){.tp-loading-logo-wrap{width:210px;min-height:76px;border-radius:16px;padding:9px 14px}.tp-loading-logo{max-width:180px}.tp-loading-orbit-one{width:380px;height:380px}.tp-loading-orbit-two{width:570px;height:570px}}
        @media(prefers-reduced-motion:reduce){.tp-loading-logo-wrap,.tp-loading-bar span,.tp-loading-orbit,.tp-loading-glow{animation:none}}
      `}</style>
    </main>
  );
}
