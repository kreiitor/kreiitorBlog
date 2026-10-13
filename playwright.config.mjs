import {defineConfig} from '@playwright/test';
const baseURL=process.env.PREVIEW_URL||'http://localhost:4321/';
export default defineConfig({
 testDir:'tests/browser',timeout:45000,workers:1,reporter:'list',outputDir:'.artifacts/playwright',
 use:{baseURL,channel:'chrome',headless:true,trace:'retain-on-failure'},
 projects:[
  {name:'desktop',use:{viewport:{width:1440,height:1000}}},
  {name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
 ],
 webServer:{command:'npm run preview',url:new URL('./',baseURL).href,reuseExistingServer:!process.env.CI,timeout:30000},
});
