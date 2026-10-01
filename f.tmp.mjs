import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.setContent(
  `<body style="margin:0;background:#000"><video id=v src="file:///home/user/Sarjy/public/film/sarjy-film-ar.mp4" muted style="width:1280px;height:720px;object-fit:contain"></video></body>`,
);
const r = await p.evaluate(async () => {
  const v = document.getElementById("v");
  return await new Promise((res) => {
    v.onerror = () => res("error " + (v.error && v.error.code));
    v.onloadedmetadata = () => {
      v.currentTime = 6;
    };
    v.onseeked = () => res(`ok ${v.videoWidth}x${v.videoHeight} ${v.duration}`);
    setTimeout(() => res("timeout " + v.readyState), 8000);
  });
});
console.log(r);
for (const t of [3, 10, 20, 35, 50, 62]) {
  await p.evaluate(
    (t) =>
      new Promise((res) => {
        const v = document.getElementById("v");
        v.onseeked = res;
        v.currentTime = t;
      }),
    t,
  );
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${process.argv[2]}/film-${t}.png` });
}
await b.close();
