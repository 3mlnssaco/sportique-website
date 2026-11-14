import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const appStore='https://apps.apple.com/kr/app/uniqdata/id6760312240';
const playStore='https://play.google.com/store/apps/details?id=io.uniqdata.app';
const shots=['home','ai-chat','report','routine','checkin'].map(id=>`/assets/verified/uniqdata-appstore-${id}-20260926.webp`);

test('home, products and UniQdata detail show the live store screens and both store links',()=>{
 const provenance=read('assets/verified/asset-provenance.json');
 for(const shot of shots){assert.ok(existsSync(shot.slice(1)),shot);assert.ok(provenance.includes(`"public_path": "${shot}"`),shot);}
 for(const prefix of ['', 'en/'])for(const page of ['index.html','products/index.html','products/uniqdata/index.html']){
  const html=read(prefix+page);
  assert.ok(html.includes('class="live-app"'),prefix+page);
  for(const url of [appStore,playStore])assert.ok(html.includes(`href="${url}"`),prefix+page+' '+url);
  for(const shot of shots)assert.ok(html.includes(`src="${shot}"`),prefix+page+' '+shot);
 }
 assert.ok(read('index.html').indexOf('class="live-app"')<read('index.html').indexOf('id="problem"'));
});

test('founder page links to public external profiles',()=>{
 for(const prefix of ['', 'en/']){
  const html=read(prefix+'founder/index.html');
  for(const url of ['https://www.linkedin.com/in/seunghun-daniel-lee/','https://github.com/3mlnssaco'])assert.ok(html.includes(`href="${url}"`),prefix+url);
  assert.ok(!html.includes('href=""'));
 }
});

test('company page presents SportiQue as a solo-founder company with public profile links',()=>{
 for(const prefix of ['', 'en/']){
  const about=read(prefix+'about/index.html');
  const section=about.slice(about.indexOf('class="team-section"'),about.indexOf('class="company-facts"'));
  assert.ok(section.includes('class="team-founder"'),prefix);
  for(const url of ['https://www.linkedin.com/in/seunghun-daniel-lee/','https://github.com/3mlnssaco',`${prefix?'/en':''}/founder/`])assert.ok(section.includes(`href="${url}"`),prefix+url);
  for(const name of ['손준','조이환','김지연','최유민','김형태','Jun Son','Ihwan Jo'])assert.ok(!about.includes(name),name);
  assert.doesNotMatch(section,/010-|tel:/);
 }
});
