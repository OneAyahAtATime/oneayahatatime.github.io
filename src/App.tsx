import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Access, type Licence, accessState, buyHref, codeFingerprint, codeOk,
  hasAccess, ownsAnotherApp, unlockWithKey,
  readAccess, recheck, writeAccess, trialLeft,
  PLANS, SUPPORT_EMAIL, TRIAL_DAYS, SPELLING_QUEST_URL, KIDS_CHECKLIST_URL,
} from "./access";
import {
  type RemoteReciter, type SyncState,
  familyFingerprint, pullReciters, pushReciter, reciterHasBeenUsed,
} from "./sync";
import Tour, { tourSeen, markTourSeen } from "./Tour";

/**
 * Artwork lives in public/ and is referenced relative to wherever the site is
 * served from, so one build works at the root of a domain or inside a
 * subfolder. BASE_URL is "./" for this project — see vite.config.ts.
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type Surah = { n: number; ar: string; en: string };
type Juz = { n: number; label?: string; surahs: number[] };

const surahs: Surah[] = [
  [1,"الفاتحة","Al-Fatiha"],[2,"البقرة","Al-Baqarah"],[3,"آل عمران","Aal Imran"],[4,"النساء","An-Nisa"],[5,"المائدة","Al-Ma’idah"],[6,"الأنعام","Al-An’am"],[7,"الأعراف","Al-A’raf"],[8,"الأنفال","Al-Anfal"],[9,"التوبة","At-Tawbah"],[10,"يونس","Yunus"],[11,"هود","Hud"],[12,"يوسف","Yusuf"],[13,"الرعد","Ar-Ra’d"],[14,"إبراهيم","Ibrahim"],[15,"الحجر","Al-Hijr"],[16,"النحل","An-Nahl"],[17,"الإسراء","Al-Isra"],[18,"الكهف","Al-Kahf"],[19,"مريم","Maryam"],[20,"طه","Ta-Ha"],[21,"الأنبياء","Al-Anbiya"],[22,"الحج","Al-Hajj"],[23,"المؤمنون","Al-Mu’minun"],[24,"النور","An-Nur"],[25,"الفرقان","Al-Furqan"],[26,"الشعراء","Ash-Shu’ara"],[27,"النمل","An-Naml"],[28,"القصص","Al-Qasas"],[29,"العنكبوت","Al-Ankabut"],[30,"الروم","Ar-Rum"],[31,"لقمان","Luqman"],[32,"السجدة","As-Sajdah"],[33,"الأحزاب","Al-Ahzab"],[34,"سبأ","Saba"],[35,"فاطر","Fatir"],[36,"يس","Ya-Sin"],[37,"الصافات","As-Saffat"],[38,"ص","Sad"],[39,"الزمر","Az-Zumar"],[40,"غافر","Ghafir"],[41,"فصلت","Fussilat"],[42,"الشورى","Ash-Shura"],[43,"الزخرف","Az-Zukhruf"],[44,"الدخان","Ad-Dukhan"],[45,"الجاثية","Al-Jathiyah"],[46,"الأحقاف","Al-Ahqaf"],[47,"محمد","Muhammad"],[48,"الفتح","Al-Fath"],[49,"الحجرات","Al-Hujurat"],[50,"ق","Qaf"],[51,"الذاريات","Adh-Dhariyat"],[52,"الطور","At-Tur"],[53,"النجم","An-Najm"],[54,"القمر","Al-Qamar"],[55,"الرحمن","Ar-Rahman"],[56,"الواقعة","Al-Waqi’ah"],[57,"الحديد","Al-Hadid"],[58,"المجادلة","Al-Mujadilah"],[59,"الحشر","Al-Hashr"],[60,"الممتحنة","Al-Mumtahanah"],[61,"الصف","As-Saff"],[62,"الجمعة","Al-Jumu’ah"],[63,"المنافقون","Al-Munafiqun"],[64,"التغابن","At-Taghabun"],[65,"الطلاق","At-Talaq"],[66,"التحريم","At-Tahrim"],[67,"الملك","Al-Mulk"],[68,"القلم","Al-Qalam"],[69,"الحاقة","Al-Haqqah"],[70,"المعارج","Al-Ma’arij"],[71,"نوح","Nuh"],[72,"الجن","Al-Jinn"],[73,"المزمل","Al-Muzzammil"],[74,"المدثر","Al-Muddaththir"],[75,"القيامة","Al-Qiyamah"],[76,"الإنسان","Al-Insan"],[77,"المرسلات","Al-Mursalat"],[78,"النبأ","An-Naba’"],[79,"النازعات","An-Naziat"],[80,"عبس","‘Abasa"],[81,"التكوير","At-Takweer"],[82,"الإنفطار","Al-Infitar"],[83,"المطففين","Al-Mutaffifin"],[84,"الإنشقاق","Al-Inshiqaq"],[85,"البروج","Al-Burooj"],[86,"الطارق","At-Tariq"],[87,"الأعلى","Al-A’la"],[88,"الغاشية","Al-Ghashiyah"],[89,"الفجر","Al-Fajr"],[90,"البلد","Al-Balad"],[91,"الشمس","Ash-Shams"],[92,"الليل","Al-Layl"],[93,"الضحى","Ad-Duha"],[94,"الشرح","Ash-Sharh"],[95,"التين","At-Teen"],[96,"العلق","Al-‘Alaq"],[97,"القدر","Al-Qadr"],[98,"البينة","Al-Bayyinah"],[99,"الزلزلة","Az-Zalzalah"],[100,"العاديات","Al-‘Adiyat"],[101,"القارعة","Al-Qari’ah"],[102,"التكاثر","At-Takathur"],[103,"العصر","Al-‘Asr"],[104,"الهمزة","Al-Humazah"],[105,"الفيل","Al-Feel"],[106,"قريش","Quraish"],[107,"الماعون","Al-Ma’oon"],[108,"الكوثر","Al-Kawthar"],[109,"الكافرون","Al-Kafiroon"],[110,"النصر","An-Nasr"],[111,"المسد","Al-Masad"],[112,"الإخلاص","Al-Ikhlas"],[113,"الفلق","Al-Falaq"],[114,"الناس","An-Nas"],
].map(([n,ar,en]) => ({ n: n as number, ar: ar as string, en: en as string }));

// Juz names are taken from the artwork, so the app and the pages always agree.
// Only the Juz 19-30 pages print a name; 1-18 have none, so none is shown.
const rawJuz: [number, number[], string?][] = [
  [1,[1,2]],[2,[2]],[3,[3]],[4,[4]],[5,[4]],[6,[5]],[7,[6]],[8,[7]],[9,[8]],[10,[9]],
  [11,[10,11]],[12,[12]],[13,[13,14]],[14,[15,16]],[15,[17,18]],[16,[19,20]],[17,[21,22]],[18,[23,24,25]],
  [19,[26,27],"Wa Qalalladhina"],[20,[28,29],"A’man Khalaqa"],[21,[30,31,32,33],"Utlu Ma Uhiya"],[22,[34,35],"Wa Manyaqnut"],
  [23,[36,37,38,39],"Wa Mali"],[24,[40,41],"Faman Azlam"],[25,[42,43,44,45],"Ilayhi Yuraddu"],
  [26,[46,47,48,49,50,51],"Ha-Mim"],[27,[52,53,54,55,56,57],"Qala Fama Khatbukum"],
  [28,[58,59,60,61,62,63,64,65,66],"Qad Sami’a"],[29,[67,68,69,70,71,72,73,74,75,76,77],"Tabarak"],
  [30,Array.from({length:37},(_,i)=>i+78),"‘Amma"],
];
/**
 * Every tile carries the same yellow line the artwork prints on that page.
 *
 * Juz 19-30 print a Juz name on the banner, so that name is used. Juz 1-18
 * print no Juz name — the page shows the surahs on the shelf instead — so the
 * tile lists those surahs, in the artwork's own spelling. Where a Juz carries
 * on a surah that began earlier, the page says "Al-Baqarah continues"; the
 * tile says the same.
 */
const juzs: Juz[] = (() => {
  const started = new Set<number>();
  return rawJuz.map(([n,inJuz,label])=>{
    const carriedOver = inJuz.length===1 && started.has(inJuz[0]);
    for(const s of inJuz) started.add(s);
    const named = inJuz.map(s=>surahs[s-1].en);
    return { n, surahs:inJuz, label: label ?? (carriedOver?`${named[0]} continues`:named.join(" · ")) };
  });
})();
const pageGroups = [[1,6],[7,13],[14,18],[19,22],[23,25],[26,27],[28,29],[30,30]] as const;
const colorOptions = [
  {value:"#e05287",label:"Rose"},{value:"#f06f61",label:"Coral"},{value:"#ed8f3d",label:"Orange"},{value:"#f2c94c",label:"Golden yellow"},{value:"#65b96e",label:"Leaf green"},{value:"#2bb3a3",label:"Aqua"},{value:"#43b8d1",label:"Sky blue"},{value:"#4f8bd8",label:"Blue"},{value:"#7d5bd1",label:"Purple"},{value:"#b765c4",label:"Orchid"},
  {value:"sunset",label:"Sunset blend",background:"linear-gradient(135deg,#f59a62,#e75c86 52%,#8a62c7)"},{value:"sunrise",label:"Sunrise blend",background:"linear-gradient(135deg,#f6a76b,#f5cf68 52%,#b692d8)"},
];
const colors = colorOptions.map(option=>option.value);
const artForJuz = (n:number) => asset(n<=6?"juz-1-6.png":n<=13?"juz-7-13.png":n<=18?"juz-14-18.png":n<=22?"juz-19-22.png":n<=25?"juz-23-25.png":n<=27?"juz-26-27.png":n<=29?"juz-28-29.png":"juz-30-five-shelves-v9.png");
const cropForJuz = (n:number) => n<=6?84.1:n<=13?82.1:n<=18?82.5:n<=22?81.5:n<=25?80:n<=27?78:n<=29?84.5:87.5;
type Rect = [number,number,number,number];
const row = (count:number,y:number,x1:number,x2:number,h:number):Rect[] => Array.from({length:count},(_,i)=>{const gap=1.1,w=(x2-x1-gap*(count-1))/count;return [x1+i*(w+gap),y,w,h]});
const bookRects:Record<number,Rect[]> = {
  1:[[29,15.28,20,10],[52,15.28,20,10]],2:[[28,28.24,44,8]],3:[[31,40.3,39,9]],4:[[31,53.3,39,8]],5:[[29,65.43,43,8]],6:[[31,76.24,40,8]],
  7:[[41,13.75,18,10]],8:[[41,24.78,18,9]],9:[[41,35.84,18,9]],10:[[41,47.08,18,8]],11:[[32,55.82,17,9],[52,55.82,18,9]],12:[[41,64.65,18,9]],13:[[32,74.84,17,8],[52,74.84,18,8]],
  14:[[31,14,19,11],[52,14,18,11]],15:[[31,28,19,11],[52,28,18,11]],16:[[31,42,19,11],[52,42,18,11]],17:[[31,56,19,11],[52,56,18,11]],18:[[18,71,20,10],[41,71,19,10],[63,71,20,10]],
  19:[[32,18,17,13],[53,18,17,13]],20:[[31,36,18,12],[53,36,18,12]],21:[[15,53,15,12],[33,53,14,12],[50,53,16,12],[69,53,16,12]],22:[[29,68,18,13],[55,68,17,13]],
  23:[[15,20,16,17],[33,20,16,17],[51,20,16,17],[69,20,16,17]],24:[[29,44,19,15],[51,44,19,15]],25:[[14,65,16,14],[33,65,15,14],[51,65,16,14],[70,65,16,14]],
  26:row(6,27,11,93,18),27:row(6,56,11,93,19),
  28:[...row(5,18,13,90,15),...row(4,35,18,84,14)],29:[...row(6,55,8,91,13),...row(5,70,15,87,13)],
30:[[11.72,13.02,10.37,11.33],[23,13.02,10.48,11.33],[34.39,13.02,10.15,11.33],[45.43,13.02,10.37,11.33],[56.6,13.02,10.03,11.33],[67.53,13.02,10.26,11.33],[78.69,13.02,10.15,11.33],[9.7,27.11,10.26,11.44],[20.86,27.11,10.37,11.44],[32.13,27.11,10.48,11.44],[43.52,27.11,10.48,11.44],[54.9,27.11,10.37,11.44],[66.18,27.11,10.6,11.44],[77.68,27.11,10.71,11.44],[9.92,41.15,10.37,12.51],[21.08,41.15,10.48,12.51],[32.47,41.15,10.71,12.51],[44.08,41.15,10.37,12.51],[55.47,41.15,10.03,12.51],[66.4,41.15,10.48,12.51],[77.68,41.15,10.71,12.51],[12.06,57.44,9.81,12.46],[22.77,57.44,9.92,12.46],[33.48,57.44,10.03,12.46],[44.31,57.44,9.81,12.46],[55.02,57.44,9.7,12.46],[65.5,57.44,9.92,12.46],[76.32,57.44,10.03,12.46],[87.15,57.44,9.81,12.46],[8.46,73.62,9.24,12.57],[18.49,73.62,9.24,12.57],[28.52,73.62,9.02,12.57],[38.33,73.62,9.02,12.57],[48.14,73.62,9.02,12.57],[57.95,73.62,9.13,12.57],[67.87,73.62,9.02,12.57],[77.68,73.62,9.13,12.57]],
};
const fullBookRect = (juz:number,r:Rect):Rect => {
  const dense=juz===30,xPad=dense ? .18 : .55,topPad=dense ? .75 : 1.35,bottomPad=dense ? .55 : .8;
  return [Math.max(0,r[0]-xPad),Math.max(0,r[1]-topPad),Math.min(100-r[0]+xPad,r[2]+xPad*2),r[3]+topPad+bottomPad];
};
const targetedPaintRects:Record<string,Rect> = {
  "5-4":[27.6,64.33,45.1,10],"11-10":[31,55.02,19.2,10.2],"13-13":[31,74.04,19.2,9.7],"13-14":[51.2,74.04,20.8,9.7],
  "16-19":[30.7,43.1,19.6,10.9],"16-20":[51.7,43.1,18.6,10.9],
  "17-21":[30.7,57.3,19.6,10.9],"17-22":[51.7,57.3,18.6,10.9],"21-31":[32.2,52.4,16.3,13.2],"21-32":[49.3,52.4,18.1,13.2],
  "22-34":[28.3,68.9,19.4,12.5],"22-35":[53.2,68.9,19.4,12.5],"23-36":[15,19.3,16.9,18],"25-43":[32.1,64.4,16.5,15.1],
  "26-51":[79.8,26.7,12.3,18.7],"27-54":[37.5,55.6,13,19.7],"27-55":[51.05,55.6,12.8,19.7],"27-56":[64.35,55.6,13,19.7],"27-57":[77.95,55.6,12.8,19.7],
  "29-67":[9.8,54.5,12.5,13.9],"29-68":[22.7,54.5,13.1,13.9],"29-69":[36.9,54.5,13,13.9],"29-70":[51.2,54.5,12.8,13.9],"29-71":[65.2,54.5,12.6,13.9],"29-73":[13.8,69.5,14.6,14.1],
};
const iconRects:Record<string,Rect> = {
  "1-1":[42.76,21.12,4.1,2.73],"1-2":[64.88,21.12,4.1,2.73],"2-2":[65.17,32.53,4.1,2.73],"3-3":[62.96,45.13,4.1,2.73],
  "4-4":[62.47,57.59,4.1,2.73],"5-4":[61.66,69.69,4.1,2.73],"6-5":[58.71,80.5,4.1,2.73],"7-6":[53.75,19.89,3.22,2.15],
  "8-7":[53.45,30.32,3.22,2.15],"9-8":[52.09,41.38,3.22,2.15],"10-9":[52.68,51.96,3.22,2.15],"11-10":[44.41,61.36,3.22,2.15],
  "11-11":[64.42,61.36,3.22,2.15],"12-12":[53.26,70.15,3.22,2.15],"13-13":[44.41,79.72,3.22,2.15],"13-14":[65.6,79.91,3.22,2.15],
  "14-15":[43.37,20.51,3.81,2.54],"14-16":[64.03,20.51,3.81,2.54],"15-17":[44.06,34.51,3.81,2.54],"15-18":[64.72,34.51,3.81,2.54],
  "16-19":[44.54,48.51,3.81,2.54],"16-20":[65.01,48.51,3.81,2.54],"17-21":[43.76,63.35,3.81,2.54],"17-22":[65.01,62.51,3.81,2.54],
  "18-23":[32.34,77.17,3.81,2.54],"18-24":[54.74,76.97,3.81,2.54],"18-25":[76.82,77.17,3.81,2.54],"19-26":[44.7,25.86,2.93,1.95],
  "19-27":[65.31,25.73,2.93,1.95],"20-28":[43.33,43.13,2.93,1.95],"20-29":[65.75,43.46,2.93,1.95],"21-30":[26.1,60.11,2.93,1.95],
  "21-31":[43.21,60.3,2.93,1.95],"21-32":[62.07,60.3,2.93,1.95],"21-33":[81.1,60.3,2.93,1.95],"22-34":[42.04,75.67,2.93,1.95],
  "22-35":[66.92,75.67,2.93,1.95],"23-36":[27.1,29.84,2.93,1.95],"23-37":[45.1,29.84,2.93,1.95],"23-38":[63.1,29.84,2.93,1.95],
  "23-39":[81.1,29.84,2.93,1.95],"24-40":[42.93,52.7,2.93,1.95],"24-41":[65.89,52.7,2.93,1.95],"25-42":[25.32,73.4,2.93,1.95],
  "25-43":[43.71,73.4,2.93,1.95],"25-44":[62.61,73.4,2.93,1.95],"25-45":[81.61,73.4,2.93,1.95],"26-46":[19.47,37.59,3.52,2.34],
  "26-47":[33.32,37.59,3.52,2.34],"26-48":[47.13,37.59,3.52,2.34],"26-49":[60.98,37.59,3.52,2.34],"26-50":[74.58,37.4,3.52,2.34],
  "26-51":[87.55,37.59,3.52,2.34],"27-52":[18.98,67.06,3.52,2.34],"27-53":[32.44,67.06,3.52,2.34],"27-54":[45.86,67.06,3.52,2.34],
  "27-55":[59.41,67.06,3.52,2.34],"27-56":[72.92,67.06,3.52,2.34],"27-57":[86.19,67.06,3.52,2.34],"28-58":[24.09,26.93,2.44,1.63],
  "28-59":[39.61,26.93,2.44,1.63],"28-60":[55.33,26.93,2.44,1.63],"28-61":[70.68,26.61,2.44,1.63],"28-62":[85.81,26.93,2.44,1.63],
  "28-63":[29.85,43.66,2.44,1.63],"28-64":[46.83,43.66,2.44,1.63],"28-65":[63.43,43.73,2.44,1.63],"28-66":[80.01,43.66,2.44,1.63],
  "29-67":[17.71,62.67,2.44,1.63],"29-68":[31.7,62.67,2.44,1.63],"29-69":[45.74,62.73,2.44,1.63],"29-70":[59.74,62.67,2.44,1.63],
  "29-71":[73.75,62.48,2.44,1.63],"29-72":[87.77,62.54,2.44,1.63],"29-73":[23.75,77.45,2.44,1.63],"29-74":[38.93,77.45,2.44,1.63],
  "29-75":[54.04,77.45,2.44,1.63],"29-76":[69.07,77.45,2.44,1.63],"29-77":[83.67,77.45,2.44,1.63],"30-78":[18.26,19.22,3.16,1.58],
  "30-79":[29.61,19.22,3.16,1.58],"30-80":[40.71,19.22,3.16,1.58],"30-81":[51.97,19.28,3.16,1.58],"30-82":[62.8,19.22,3.16,1.58],
  "30-83":[73.96,19.22,3.16,1.58],"30-84":[85.05,19.28,3.16,1.58],"30-85":[16.13,33.48,3.16,1.58],"30-86":[27.4,33.48,3.16,1.58],
  "30-87":[38.78,33.42,3.16,1.58],"30-88":[50.13,33.42,3.16,1.58],"30-89":[61.44,33.42,3.16,1.58],"30-90":[72.95,33.48,3.16,1.58],
  "30-91":[84.56,33.48,3.16,1.58],"30-92":[16.46,47.94,3.16,1.58],"30-93":[27.73,47.94,3.16,1.58],"30-94":[39.35,47.94,3.16,1.58],
  "30-95":[50.62,47.94,3.16,1.58],"30-96":[61.62,47.94,3.16,1.58],"30-97":[73.05,47.94,3.16,1.58],"30-98":[84.56,47.94,3.16,1.58],
  "30-99":[18.04,64.06,3.16,1.58],"30-100":[28.86,64.06,3.16,1.58],"30-101":[39.68,64.06,3.16,1.58],"30-102":[50.29,64.06,3.16,1.58],
  "30-103":[60.88,64.06,3.16,1.58],"30-104":[71.59,64.06,3.16,1.58],"30-105":[82.52,64.06,3.16,1.58],"30-106":[93.13,64.06,3.16,1.58],
  "30-107":[13.94,80.27,3.16,1.58],"30-108":[23.97,80.27,3.16,1.58],"30-109":[33.82,80.27,3.16,1.58],"30-110":[43.63,80.27,3.16,1.58],
  "30-111":[53.44,80.27,3.16,1.58],"30-112":[63.31,80.27,3.16,1.58],"30-113":[73.17,80.27,3.16,1.58],"30-114":[82.86,80.27,3.16,1.58],
};
const isolatedInteractionKeys=new Set(["26-51","27-54","27-55","27-56","27-57"]);

type CurrentWork = { surah:string; ayahs:string };
type RevisionStatus = "learning"|"memorized"|"practice";
const statusMeta:Record<RevisionStatus,{label:string;short:string;hint?:string;note?:string}> = {
  learning:{label:"I’m learning this",short:"Learning",hint:"You’re working on this one right now, a little at a time."},
  memorized:{label:"It’s in my heart",short:"In my heart",hint:"You can recite this one from memory, without looking."},
  practice:{label:"Let’s do muraja’ah",short:"Muraja’ah",hint:"Muraja’ah means revision — going back over a surah you already learned so it stays strong.",note:"revision"},
};

const journeyOrder:RevisionStatus[] = ["learning","practice","memorized"];

/**
 * The tour's practice-Juz page — three example books (Al-Fatiha, Al-Asr,
 * Al-Ikhlas) on Kathryn's own "PRACTICE • TOUR ONLY" artwork, so a brand-new
 * visitor has something safe to try status, notes, multi-select and the
 * certificate on before they have any real progress of their own. Rects read
 * directly off `public/tour-practice.png`, the same way every real Juz's
 * `bookRects` are.
 */
const PRACTICE_BOOKS: { key:string; name:string; rect:Rect }[] = [
  { key:"p-fatiha", name:"Al-Fatiha", rect:[14,30,30,23] },
  { key:"p-asr",    name:"Al-Asr",    rect:[53,30,30,23] },
  { key:"p-ikhlas", name:"Al-Ikhlas", rect:[30,59,35,23] },
];

/**
 * A Juz counts as finished only when every surah in it is "It's in my heart".
 * It used to count as finished as soon as every book had been colored, which
 * meant a single-surah Juz threw its completion celebration on the very first
 * tap, before anything had actually been memorized.
 */
const juzMemorized = (juz:Juz,statuses:Record<string,RevisionStatus>) =>
  juz.surahs.every(n=>statuses[`${juz.n}-${n}`]==="memorized");

/** Most Juz hold a single surah, so "0 of 1 books" was on screen 10 times. */
const bookWord = (total:number) => total===1?"book":"books";

/** "19", "19 and 20", "19, 20 and 21" — never a bare comma list. */
const listWords = (items:(string|number)[]) =>
  items.length<2 ? String(items[0] ?? "")
  : `${items.slice(0,-1).join(", ")} and ${items[items.length-1]}`;

/** A celebration covers one Juz, several at once, or the whole Quran. */
type Celebration = { khatm:boolean; juz:number[] };

/**
 * One piece of falling confetti.
 *
 * These values are worked out here rather than in CSS because `calc()` has no
 * modulus operator — `calc(12px + (var(--i) % 4) * 4px)` is simply invalid, and
 * a browser drops the whole declaration. That silently cost the confetti its
 * `left`, so every piece stacked in the middle of the screen behind the card
 * and nothing appeared to fall at all.
 */
const confettiPiece = (i:number,khatm:boolean):React.CSSProperties => khatm ? {
  left:`${(i*29)%100}%`,
  fontSize:`${14+(i%5)*5}px`,
  color:`hsl(${38+(i%5)*5} ${74+(i%3)*8}% ${57+(i%4)*6}%)`,
  animationDuration:`${(2.6+(i%7)*0.24).toFixed(2)}s`,
  animationDelay:`${(i*-0.11).toFixed(2)}s`,
} : {
  left:`${(i*37)%100}%`,
  fontSize:`${12+(i%4)*4}px`,
  color:`hsl(${(i*31)%360} 80% 67%)`,
  animationDuration:`${(2.2+(i%5)*0.28).toFixed(2)}s`,
  animationDelay:`${(i*-0.13).toFixed(2)}s`,
};

function BlankBookIcon() {
  return <span className="blank-book" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><rect x="15" y="8" width="34" height="48" rx="7" stroke="#bda2d8" strokeWidth="3" strokeDasharray="5 5"/><circle cx="32" cy="41" r="8.5" stroke="#cdb6de" strokeWidth="2.5"/><path d="M25 21h14" stroke="#d8c6e5" strokeWidth="3" strokeLinecap="round"/><path d="M27 28h10" stroke="#e0d2ea" strokeWidth="3" strokeLinecap="round"/></svg></span>;
}

function JourneyIcon({status,className="",style}:{status:RevisionStatus;className?:string;style?:React.CSSProperties}) {
  const src=asset(status==="learning"?"status-art/learning-moon.png":status==="memorized"?"status-art/memorized-star.png":"status-art/practice-beads.png");
  return <span className={`journey-icon journey-${status} ${className}`} style={style} aria-hidden="true"><img src={src} alt=""/></span>;
}
/**
 * `ayahs` is keyed by book ("<juz>-<surah>"), so every surah being learned can
 * carry its own range. It used to be one note per Juz, which meant a Juz with
 * six surahs could only remember one of them.
 *
 * `workingOn` is the old per-Juz shape. It is read once and migrated, then left
 * alone so an older save is never lost.
 */
/**
 * `dates` is keyed by Juz number, plus one extra key — "khatm" — for the day
 * the whole Quran was finished. `honorific` is only used on that certificate.
 */
type Honorific = "Hafizah" | "Hafiz";
type Saved = { name: string; colored: Record<string,string>; dates: Record<string,string>; favorites: Record<string,string>; ayahs: Record<string,string>; workingOn:Record<string,CurrentWork>; statuses:Record<string,RevisionStatus>; statusAt:Record<string,number>; practiceDays:string[]; honorific?:Honorific };
const empty: Saved = { name:"", colored:{}, dates:{}, favorites:{}, ayahs:{}, workingOn:{}, statuses:{}, statusAt:{}, practiceDays:[], honorific:"Hafizah" };

/**
 * When each book's status was last changed, as a plain millisecond stamp.
 *
 * It exists so that progress can travel between a family's devices without one
 * of them undoing another's work: the newer decision wins, per book. Marking a
 * memorized surah back to muraja'ah is a real decision and must survive; a phone
 * that has been in a drawer since Ramadan must not be able to reverse it.
 */
const stampStatus = (previous:Record<string,number>|undefined, keys:string[]):Record<string,number> => {
  const at = { ...(previous||{}) };
  const now = Date.now();
  for(const key of keys) at[key] = now;
  return at;
};

/**
 * What this device has to say about every book it has an opinion on, including
 * the ones somebody took back to blank. A book with a stamp but no status was
 * un-marked here; sending "cleared" is how that undo reaches the family's other
 * devices instead of being quietly reversed by one of them.
 */
const outgoingStatuses = (saved:Saved):Record<string,string> => {
  const out:Record<string,string> = { ...saved.statuses };
  for(const key of Object.keys(saved.statusAt||{})) if(!out[key]) out[key] = "cleared";
  return out;
};
const KHATM_KEY="khatm";
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};

/**
 * A reciter's name is only ever a label. Progress is stored against a stable
 * id, so renaming a reciter — or adding and removing others — never disturbs
 * anyone else's books.
 *
 * No name ships with the app and none is required: the default is neutral, and
 * families are asked for a nickname rather than a full name. A nickname does
 * travel to the family's own devices once they hold a licence key, filed under a
 * fingerprint of that key and nothing else — see sync.ts.
 */
type Reciter = { id:string; name:string };
const RECITERS_KEY="quran-tracker-reciters";
const defaultReciterName=(position:number)=>`Reciter ${position}`;
const progressKey=(id:string)=>`quran-tracker-progress-${id}`;
const MAX_NAME=24;

/**
 * Carries the old one-note-per-Juz field across to per-book notes, matching the
 * remembered surah name back to its book.
 */
function ayahsFromWorkingOn(workingOn:Record<string,CurrentWork>|undefined):Record<string,string> {
  const carried:Record<string,string> = {};
  if(!workingOn) return carried;
  for(const [juzKey,work] of Object.entries(workingOn)) {
    if(!work?.ayahs) continue;
    const juz=juzs.find(j=>String(j.n)===juzKey);
    const surah=juz?.surahs.find(n=>surahs[n-1].en===work.surah);
    if(juz&&surah) carried[`${juz.n}-${surah}`]=work.ayahs;
  }
  return carried;
}

/**
 * Fills in anything a stored record is missing, so a save written by an older
 * version of the app can never leave a field undefined.
 */
function normalize(raw:unknown,name:string):Saved {
  if(!raw||typeof raw!=="object") return {...empty,name};
  const partial=raw as Partial<Saved>;
  return {
    name,
    colored:partial.colored??{},
    dates:partial.dates??{},
    favorites:partial.favorites??{},
    ayahs:partial.ayahs??ayahsFromWorkingOn(partial.workingOn),
    workingOn:partial.workingOn??{},
    statuses:partial.statuses??{},
    statusAt:partial.statusAt??{},
    practiceDays:partial.practiceDays??[],
    honorific:partial.honorific==="Hafiz"?"Hafiz":"Hafizah",
  };
}

const cleanName=(value:string,fallback:string)=>value.trim().slice(0,MAX_NAME)||fallback;

/**
 * Carries over anything saved by the earlier two-slot version, which numbered
 * its reciters "Learner 1" and "Learner 2". A slot is kept only if it was
 * actually used; an untouched second slot is dropped, because the app now
 * starts with a single reciter and lets families add more.
 */
function migrateFromSlots():Reciter[] {
  const carried:Reciter[] = [];
  let storedNames:unknown = null;
  try { storedNames = JSON.parse(localStorage.getItem("quran-tracker-learner-names") || "null"); } catch { /* ignore */ }

  for(let slot=0; slot<2; slot++) {
    const progress = localStorage.getItem(`quran-tracker-slot-${slot}`);
    const wasUsed = !!progress && progress !== "null" && progress !== "{}";
    if(slot>0 && !wasUsed) continue;

    const raw = Array.isArray(storedNames) ? storedNames[slot] : null;
    const preset = defaultReciterName(carried.length+1);
    // "Learner 2" becomes "Reciter 2"; anything the family typed is kept as-is.
    const name = typeof raw==="string" && raw.trim() && !/^Learner \d+$/.test(raw.trim())
      ? cleanName(raw,preset) : preset;

    const id = `s${slot}`;
    carried.push({ id, name });
    if(progress) { try { localStorage.setItem(progressKey(id),progress); } catch { /* ignore */ } }
  }
  return carried;
}

function readReciters():Reciter[] {
  const fresh = [{ id:"r1", name:defaultReciterName(1) }];
  try {
    const stored = localStorage.getItem(RECITERS_KEY);
    if(!stored) {
      const carried = migrateFromSlots();
      return carried.length ? carried : fresh;
    }
    const parsed = JSON.parse(stored);
    if(!Array.isArray(parsed)) return fresh;
    const valid = parsed
      .filter((r):r is Reciter => !!r && typeof r.id==="string" && typeof r.name==="string")
      .map((r,i)=>({ id:r.id, name:cleanName(r.name,defaultReciterName(i+1)) }));
    return valid.length ? valid : fresh;
  } catch { return fresh; }
}

function writeReciters(reciters:Reciter[]):void {
  try { localStorage.setItem(RECITERS_KEY,JSON.stringify(reciters)); } catch { /* storage blocked */ }
}

function readProgress(id:string,name:string):Saved {
  try {
    const stored=localStorage.getItem(progressKey(id));
    if(stored) return normalize(JSON.parse(stored),name);
  } catch {
    // Unreadable or blocked storage is treated as a fresh start rather than a crash.
  }
  return {...empty,name};
}

function writeProgress(id:string,value:Saved):boolean {
  try { localStorage.setItem(progressKey(id),JSON.stringify(value)); return true; }
  catch { return false; }
}

function forgetProgress(id:string):void {
  try { localStorage.removeItem(progressKey(id)); } catch { /* storage blocked */ }
}

/**
 * The way in. Three faces, because the three reasons someone is standing here
 * are completely different and deserve different words:
 *
 *  - "new"        never opened the door. Offer the free week.
 *  - "trial-over" had the free week. It's up.
 *  - "ended"      paid, and the subscription has since stopped. The most
 *                 delicate one: their books are safe and they need to know that
 *                 before anything else, because the usual cause is a card that
 *                 quietly failed rather than a decision to leave.
 */
/**
 * Proving you already own Spelling Quest or Muslim Kids Checklist.
 *
 * The $25 price is real and permanent, not a first-year discount, so it is worth
 * a moment's checking. Rather than take somebody's word for it, the app asks for
 * the key or code from that other purchase and checks it.
 *
 * Two things this deliberately does *not* do. It does not make anybody type a
 * key before they can see that a cheaper price exists — the price is named
 * first, and only opening it asks for proof. And it never answers "no" because
 * the network failed: an offline answer offers to email instead, because a real
 * customer told "you don't own this" would rightly be furious.
 */
/**
 * The lower prices for people who already have one of our apps — the $25 price
 * and the $89 all-three-apps price both work this way. **Neither is a bare buy
 * link.** Kathryn's rule, 19 Aug: a key or code from another app has to check
 * out first, for both prices, not just the $25 one — so someone can't reach a
 * discount price without actually already owning something of ours.
 *
 * Deliberately **not** called an "upgrade" — nobody is upgrading anything. They
 * already bought something of ours and this is simply what it costs them.
 *
 * The price is named before anything is asked. Only opening it asks for proof,
 * so nobody has to type a key to discover a cheaper price exists. And it never
 * answers "no" because the network failed: an offline answer offers to email,
 * because a real customer told "you don't own this" would rightly be furious.
 */
function OwnershipGatedPrice({ plan, teaser, foundNote, buyLabel }: {
  plan: "second" | "addTwo";
  /** The closed-state line, e.g. "Already have X or Y? It's $25 — [show me]".
   *  Pass null when the teaser is shown once, shared, by a wrapping component
   *  instead of repeated per plan. */
  teaser: React.ReactNode | null;
  /** Shown once ownership checks out, under the buy link. */
  foundNote: React.ReactNode;
  /** Full closed-state button text, e.g. "Add one — $25 a year". */
  buyLabel: string;
}) {
  const [open,setOpen] = useState(false);
  const [typed,setTyped] = useState("");
  const [busy,setBusy] = useState(false);
  const [state,setState] = useState<"asking"|"yes"|"no"|"offline">("asking");
  const [product,setProduct] = useState("");
  const mailto = (why:string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(why)}`;
  const inputId = `other-key-${plan}`;

  const check = async () => {
    const value = typed.trim();
    if(!value) return;
    setBusy(true);
    const result = await ownsAnotherApp(value);
    setBusy(false);
    setProduct(result.product ?? "");
    setState(result.offline ? "offline" : result.owns ? "yes" : "no");
  };

  if(!open) return <div className="gate-upgrade">
    {teaser&&<small>{teaser}</small>}
    <button type="button" className="gate-primary" onClick={()=>setOpen(true)}>
      {buyLabel}
    </button>
  </div>;

  if(state==="yes") return <div className="gate-upgrade open">
    <p className="upgrade-yes">Found it{product?` — ${product}`:""}. Thank you for coming back.</p>
    <a className="gate-primary" href={buyHref(plan)}>Continue — {PLANS[plan].price}</a>
    <small>{foundNote}</small>
  </div>;

  return <div className="gate-upgrade open">
    <label htmlFor={inputId}>Paste your key or code from Spelling Quest or Muslim Kids Checklist</label>
    <input id={inputId} value={typed} placeholder="Paste that key or code" autoComplete="off"
      onChange={e=>{ setTyped(e.target.value); if(state!=="asking") setState("asking") }}
      onKeyDown={e=>{ if(e.key==="Enter") check() }}/>
    <button className="gate-secondary" disabled={busy} onClick={check}>{busy?"Checking…":"Check"}</button>
    <small>It is only checked, never saved, and it costs that key nothing.</small>
    {state==="no"&&<p className="gate-problem" role="alert">We couldn’t match that. If you do have one
      of them, <a href={mailto("One Ayah At A Time — I already have one of your apps")}>write to us</a>{" "}
      and we’ll send you the link ourselves.</p>}
    {state==="offline"&&<p className="gate-problem" role="alert">We couldn’t check just now — that’s
      us, not you. Try again in a moment, or{" "}
      <a href={mailto("One Ayah At A Time — I already have one of your apps")}>write to us</a>{" "}
      and we’ll send you the link.</p>}
  </div>;
}

/**
 * The $25 and $49 prices, side by side under one shared teaser — both are for
 * people who already have Spelling Quest or Muslim Kids Checklist, and differ
 * only in how many apps the purchase adds. Collapsed into one block, 20 Aug
 * 2026, since the two used to repeat almost the same sentence back to back.
 */
function TwoAppPrices() {
  return <div className="gate-combo">
    <small>Already have <a href={SPELLING_QUEST_URL} target="_blank" rel="noopener">Spelling Quest</a>,{" "}
      One Ayah At A Time, or{" "}
      {KIDS_CHECKLIST_URL
        ? <a href={KIDS_CHECKLIST_URL} target="_blank" rel="noopener">Muslim Kids Checklist</a>
        : "Muslim Kids Checklist"}?</small>
    <div className="gate-combo-row">
      <OwnershipGatedPrice
        plan="second"
        teaser={null}
        buyLabel={`Add one — ${PLANS.second.price}`}
        foundNote="The same price every year, for as long as you stay."
      />
      <OwnershipGatedPrice
        plan="addTwo"
        teaser={null}
        buyLabel={`Add two — ${PLANS.addTwo.price}`}
        foundNote="One key, all three apps, the same price every year for as long as you stay."
      />
    </div>
  </div>;
}

/**
 * The $89 price: all three apps at once, for someone who doesn't have any of
 * them yet. Reworded 20 Aug 2026 to drop the ownership check that used to gate
 * it — this is meant to be reachable by anyone, not just people upgrading.
 */
function AllThreePrice() {
  return <a className="gate-primary gate-bundle" href={buyHref("bundle")}>
    Get all three — {PLANS.bundle.price}
  </a>;
}

function Gate({ state, onStartTrial, onUnlock, onCode }:{
  state: "new"|"trial-over"|"ended";
  onStartTrial: () => void;
  onUnlock: (licence: Licence) => void;
  onCode: (fingerprint: string) => void;
}) {
  const [typed,setTyped] = useState("");
  const [busy,setBusy] = useState(false);
  const [problem,setProblem] = useState("");

  const unlock = async () => {
    const value = typed.trim();
    // A code we handed out by hand. Checked first, and entirely on the device —
    // there is nothing behind it to ask, so it works with no connection at all.
    if(codeOk(value)) { onCode(codeFingerprint(value)); return; }
    if(!value) return;
    setBusy(true); setProblem("");
    const found = await unlockWithKey(value);
    if(found.ok) { onUnlock({ key:value, productId:found.productId, checked:Date.now(), dead:false }); return; }
    if(found.offline) {
      // No internet, or the shop is unreachable. Let them in and confirm later
      // rather than leave someone who has paid staring at a locked door.
      onUnlock({ key:value, productId:"", checked:0, dead:false, pending:true });
      return;
    }
    setProblem(found.noShopYet
      ? "The shop isn’t open just yet — so there are no keys to check against. If you were sent a code, that works now. Otherwise please email us."
      : found.finished
      ? "That key belongs to a purchase that has ended. If that’s a surprise, email us and we’ll sort it out."
      : "That key didn’t work. Check it, or email us and we’ll sort it out.");
    setBusy(false);
  };

  const heading = state==="ended" ? "Your subscription has ended"
    : state==="trial-over" ? "Your free week is up"
    : "Your Quran journey, one ayah at a time";

  return <main className="gate-screen">
    <section className="gate">
      <img className="gate-moon" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon and lantern"/>
      <p className="eyebrow">ONE AYAH AT A TIME</p>
      <h1>{heading}</h1>

      {state==="ended"
        ? <><p className="gate-reassure"><strong>Nothing has been deleted.</strong> Every book, date and
            certificate is still saved on this device, exactly as you left it. It comes straight back
            when the subscription starts again.</p>
          <p>The usual reason is a card that expired or a payment that didn’t go through — check your
            email from Gumroad. If you think this is a mistake, email us and we will fix it.</p></>
        : state==="trial-over"
        ? <p>We hope this past week felt like a beginning, not just a trial. Carry on for{" "}
            <strong>{PLANS.family.price}</strong> — one payment for the whole household, however many
            reciters you add.</p>
        : <><p>Memorizing the Quran is a long road, and it is easy to lose sight of how far you have
            already come. This is somewhere to see it — a shelf of beautiful books, one for every
            surah, filling in as they settle into your heart.</p>
          <p className="gate-small">Made by a small, Muslim-owned family business.</p></>}

      {state==="new" && <div className="gate-trial">
        <button className="gate-primary" onClick={onStartTrial}>Begin my {TRIAL_DAYS} free days</button>
        <small>No card, no account, nothing to cancel — just start.</small>
      </div>}

      <div className="gate-key">
        <label htmlFor="licence-key">{state==="ended"?"Paste a new key":"Already have a key or a code?"}</label>
        <input id="licence-key" value={typed} placeholder="Paste your key or code" autoComplete="off"
          onChange={e=>setTyped(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") unlock() }}/>
        <button className={state==="new"?"gate-secondary":"gate-primary"} disabled={busy} onClick={unlock}>
          {busy?"Checking…":"Unlock"}
        </button>
        {problem&&<p className="gate-problem" role="alert">{problem}</p>}
      </div>

      <div className="gate-buy">
        <a className="gate-primary" href={buyHref("family")}>{state==="ended"?"Start again":"Keep it for a year"} — {PLANS.family.price} for the whole family</a>
        <TwoAppPrices/>
        <AllThreePrice/>
        <small>12 months, renews on its own until you cancel. Cancel any time from the shop.</small>
      </div>

      <GateFooter/>
    </section>
  </main>;
}

/** The links a shop is expected to carry, on every screen someone can reach. */
function GateFooter() {
  return <p className="legal-links">
    <a href={asset("about.html")}>About</a>
    <a href={asset("schools.html")}>Schools</a>
    <a href={asset("contact.html")}>Contact</a>
    <a href={asset("terms.html")}>Terms</a>
    <a href={asset("privacy.html")}>Privacy</a>
    <a href={asset("refunds.html")}>Refunds</a>
  </p>;
}

export default function Home() {
  const [saved,setSaved] = useState<Saved>(empty);
  const [reciters,setReciters] = useState<Reciter[]>(readReciters);
  const [activeId,setActiveId] = useState(()=>readReciters()[0].id);
  const [renaming,setRenaming] = useState(false);
  const [confirmRemove,setConfirmRemove] = useState(false);
  const [loadedId,setLoadedId] = useState<string|null>(null);
  const [syncStatus,setSyncStatus] = useState("Loading…");
  const activeIndex = Math.max(0,reciters.findIndex(r=>r.id===activeId));
  const reciter = reciters[activeIndex]?.name ?? defaultReciterName(1);
  // The app opens on a home screen of all 30 Juz. Choosing one opens the
  // artwork page it lives on, with that Juz's details already expanded.
  const [activeGroup,setActiveGroup] = useState<number|null>(null);
  const [openRow,setOpenRow] = useState<number|null>(null);
  const onHome = activeGroup===null;
  const [color,setColor] = useState(colors[0]);
  const [statusBook,setStatusBook] = useState<{key:string;name:string;juz:number}|null>(null);
  // A certificate is either for one Juz (its number) or for the whole Quran.
  // A celebration can cover several Juz at once, since marking a page in one go
  // can finish more than one.
  const [celebrating,setCelebrating] = useState<Celebration|null>(null);
  const [certificate,setCertificate] = useState<number|"khatm"|null>(null);
  // Marking several books at once. While this is on, tapping a book picks it
  // rather than coloring it, and no per-book prompt interrupts.
  const [bulk,setBulk] = useState(false);
  const [picked,setPicked] = useState<string[]>([]);
  const [nextUp,setNextUp] = useState<{juz:number;name:string}|null>(null);

  /* ---- the tour's practice-Juz page ---------------------------------------
     Entirely separate state from `saved` on purpose: nothing typed or tapped
     here is ever written to storage or synced to another device, so a brand
     new visitor can try every control — status, notes, multi-select, the
     certificate — without it meaning anything once the tour ends. `goHome`
     switches it back off, same as it resets which Juz is open. */
  const [practiceMode,setPracticeMode] = useState(false);
  const [practiceStatuses,setPracticeStatuses] = useState<Record<string,RevisionStatus>>({});
  const [practiceAyahs,setPracticeAyahs] = useState<Record<string,string>>({});
  const [practiceStatusBook,setPracticeStatusBook] = useState<{key:string;name:string}|null>(null);
  const [practiceBulk,setPracticeBulk] = useState(false);
  const [practicePicked,setPracticePicked] = useState<string[]>([]);
  const [practiceHonorific,setPracticeHonorific] = useState<Honorific>("Hafizah");
  const [practiceCert,setPracticeCert] = useState(false);
  const practiceAllMemorized = PRACTICE_BOOKS.every(b=>practiceStatuses[b.key]==="memorized");
  /** True only while the tour's "note the exact ayahs" step is showing a real
   *  Juz that has nothing marked "learning" yet — shows one static example row
   *  (not wired to real storage) so the ayah-note field is actually visible
   *  rather than just described. Reset by `goHome`, same as everything else
   *  the tour switches on. */
  const [tourDemoNotes,setTourDemoNotes] = useState(false);

  /* ---- the way in --------------------------------------------------------
     Access is kept apart from progress on purpose: progress belongs to the
     family and is never touched by any of this. Losing access hides the app,
     it never deletes a book. */
  const [access,setAccess] = useState<Access>(readAccess);
  const saveAccess = (next:Access) => { setAccess(next); writeAccess(next); };
  useEffect(()=>{
    // The quiet weekly re-check, and it is genuinely quiet: it resolves to null
    // for every failure that isn't the service saying the key is finished.
    let live = true;
    recheck(access).then(next=>{ if(live&&next) saveAccess(next) });
    return ()=>{ live=false };
  // Only on load. Re-running this on every access change would loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const gateState = accessState(access);
  const daysLeft = trialLeft(access);
  // Shown once to anyone starting out, and available again from the footer.
  const [tour,setTour] = useState(false);
  useEffect(()=>{
    if(hasAccess(access)&&!tourSeen()) setTour(true);
  },[access]);

  /* ---- progress that travels ---------------------------------------------
     Progress is kept in this browser's own storage first, always: the app works
     with no connection at all and never waits for a network call before showing
     somebody their books. On top of that, a family with a licence key also has
     their progress carried between their devices, filed under a fingerprint of
     that key — see sync.ts for what that means and why it is safe.

     During the free week there is no key, so there is no fingerprint, and
     nothing about that week ever leaves the device. */
  const [syncLine,setSyncLine] = useState<SyncState>("off");
  const syncing = useRef(false);
  const syncTimer = useRef<number|undefined>(undefined);
  const firstSync = useRef(true);
  /** What the sync itself last wrote into `saved`, so it can tell its own
      handiwork from a person actually marking a book. */
  const syncWrote = useRef("");
  /* `saved` read through a ref, not a dependency. Putting it in syncNow's
     dependency list would rebuild syncNow on every keystroke, and the effect
     that runs syncNow when it changes would then fire a sync on every one. */
  const savedRef = useRef(saved);
  savedRef.current = saved;

  /** Fold one device's record into another. Newer decisions win, per book. */
  const merge = (mine:Saved, theirs:RemoteReciter):Saved => {
    const statuses:Record<string,RevisionStatus> = {...mine.statuses};
    const statusAt:Record<string,number> = {...(mine.statusAt||{})};
    const colored:Record<string,string> = {...theirs.colored, ...mine.colored};
    for(const [key,value] of Object.entries(theirs.statuses||{})) {
      const ours = statusAt[key] ?? 0;
      const yours = theirs.status_at?.[key] ?? 0;
      if(yours < ours) continue;
      statusAt[key] = yours;
      // "cleared" is how a book somebody un-marked travels: it is never a
      // status the app shows, only the news that the book went back to blank.
      if(value==="cleared") { delete statuses[key]; delete colored[key]; }
      else statuses[key] = value as RevisionStatus;
    }
    for(const key of Object.keys(statuses)) if(!colored[key]) colored[key] = theirs.colored?.[key] ?? color;
    return {
      ...mine,
      // A name typed on this device wins over a placeholder from another.
      name: /^Reciter \d+$/.test(mine.name) && theirs.nickname ? theirs.nickname : mine.name,
      colored, statuses, statusAt,
      // Notes and dates merge, with whatever is being typed here left alone.
      dates: {...theirs.dates, ...mine.dates},
      favorites: {...theirs.favorites, ...mine.favorites},
      ayahs: {...theirs.ayahs, ...mine.ayahs},
      workingOn: {...(theirs.working_on as Record<string,CurrentWork>), ...mine.workingOn},
      practiceDays: Array.from(new Set([...(theirs.practice_days||[]), ...(mine.practiceDays||[])])).sort(),
      honorific: mine.honorific && mine.honorific!=="Hafizah" ? mine.honorific
        : (theirs.honorific==="Hafiz" ? "Hafiz" : mine.honorific ?? "Hafizah"),
    };
  };

  const syncNow = useCallback(async ()=>{
    const fp = familyFingerprint(access);
    if(!fp) { setSyncLine("off"); return; }
    if(syncing.current) return;
    if(typeof navigator!=="undefined" && navigator.onLine===false) { setSyncLine("offline"); return; }
    syncing.current = true; setSyncLine("working");
    try {
      const rows = await pullReciters(fp);
      let list = readReciters();
      for(const row of rows) {
        if(row.removed) {
          // removed on another device — take them off this one too
          if(list.some(r=>r.id===row.reciter_id)) { forgetProgress(row.reciter_id); list = list.filter(r=>r.id!==row.reciter_id); }
          continue;
        }
        const known = list.find(r=>r.id===row.reciter_id);
        const mine = readProgress(row.reciter_id, known?.name ?? row.nickname ?? defaultReciterName(list.length+1));
        const merged = merge(mine, row);
        writeProgress(row.reciter_id, merged);
        if(known) { if(known.name!==merged.name) list = list.map(r=>r.id===row.reciter_id?{...r,name:merged.name}:r); }
        else list = [...list, { id:row.reciter_id, name:merged.name }];
      }
      /* A device opened for the first time has one untouched "Reciter 1". Once
         the real family arrives from another device, that placeholder is only
         clutter — a parent entering their key on a new phone should see their
         own reciters, not a stranger alongside them.

         Only on the first sync after opening the app, though. Later on, an
         untouched reciter is one somebody has just this moment added and not yet
         named, and tidying that away underneath them would be maddening. */
      const arrived = new Set(rows.filter(r=>!r.removed).map(r=>r.reciter_id));
      if(firstSync.current && arrived.size) {
        const keep = list.filter(r=>arrived.has(r.id)||reciterHasBeenUsed(r.name,readProgress(r.id,r.name)));
        if(keep.length && keep.length!==list.length) {
          for(const gone of list) if(!keep.includes(gone)) forgetProgress(gone.id);
          list = keep;
        }
      }
      firstSync.current = false;
      /* Anyone added while this sync was in the air belongs in the list too.
         Without this, the snapshot taken at the top would be written back over
         them and a brand-new reciter would vanish a couple of seconds after
         being created. */
      const removedHere = new Set(rows.filter(r=>r.removed).map(r=>r.reciter_id));
      for(const r of readReciters())
        if(!list.some(x=>x.id===r.id) && !removedHere.has(r.id)) list = [...list,r];
      if(!list.length) list = readReciters();
      writeReciters(list);

      for(const r of list) {
        const mine = readProgress(r.id,r.name);
        if(!reciterHasBeenUsed(r.name,mine)) continue;    // don't send placeholders
        await pushReciter(fp,{ id:r.id, name:r.name, colored:mine.colored, statuses:outgoingStatuses(mine),
          statusAt:mine.statusAt||{}, dates:mine.dates, favorites:mine.favorites, ayahs:mine.ayahs,
          workingOn:mine.workingOn, practiceDays:mine.practiceDays, honorific:mine.honorific ?? "Hafizah" });
      }

      setReciters(list);
      if(list.some(r=>r.id===activeId)) {
        /* Only disturb the screen if something actually came back different.
           Handing React a fresh object every time would look identical to the
           person and identical to the code — but `saved` changes identity, the
           effect below sees a save, and schedules another sync. That is a loop
           with no exit: a pull and a push every two and a half seconds, for ever,
           for every family. It showed up as a footer that would not sit still. */
        const fresh = readProgress(activeId,list.find(r=>r.id===activeId)!.name);
        const asText = JSON.stringify(fresh);
        if(asText !== JSON.stringify(savedRef.current)) { syncWrote.current = asText; setSaved(fresh) }
      }
      else if(list.length) setActiveId(list[0].id);
      setSyncLine("ok");
    } catch {
      setSyncLine("later");                 // never let a sync problem interrupt anybody
    } finally {
      syncing.current = false;
    }
  // merge and the setters are stable for the life of the screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[access,activeId]);

  useEffect(()=>{
    if(!hasAccess(access)) return;
    syncNow();
    const wake = ()=>{ if(!document.hidden) syncNow() };
    document.addEventListener("visibilitychange",wake);
    window.addEventListener("online",syncNow);
    return ()=>{ document.removeEventListener("visibilitychange",wake); window.removeEventListener("online",syncNow) };
  },[access,syncNow]);

  useEffect(()=>{
    if(loadedId!==activeId) return;
    // Every save nudges a sync, held back a moment so that racing through a
    // page of books doesn't fire one for each tap. A save the sync itself just
    // made is not a reason to sync again — see the note where syncWrote is set.
    if(JSON.stringify(saved) === syncWrote.current) return;
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(()=>{ syncNow() },2500);
    return ()=>window.clearTimeout(syncTimer.current);
  },[saved,activeId,loadedId,syncNow]);

  useEffect(()=>{
    const current=reciters.find(r=>r.id===activeId);
    setSaved(readProgress(activeId,current?.name ?? defaultReciterName(1)));
    setLoadedId(activeId);
    setSyncStatus("Saved on this device");
  // Only switching reciter reloads progress. Renaming one must not.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeId]);
  useEffect(()=>{
    if(loadedId!==activeId) return;
    if(!writeProgress(activeId,saved)) setSyncStatus("This browser won’t let the app save — check its privacy settings");
  },[saved,activeId,loadedId]);

  const commitReciters=(next:Reciter[])=>{ setReciters(next); writeReciters(next); };

  const renameReciter=(value:string)=>{
    const cleaned=cleanName(value,defaultReciterName(activeIndex+1));
    commitReciters(reciters.map(r=>r.id===activeId?{...r,name:cleaned}:r));
    setSaved(s=>({...s,name:cleaned}));
  };

  const addReciter=()=>{
    // Ids must stay unique for the lifetime of the browser's storage, so the
    // counter is based on what already exists rather than on the list length.
    const taken=new Set(reciters.map(r=>r.id));
    let n=reciters.length+1;
    while(taken.has(`r${n}`)) n++;
    const created:Reciter={ id:`r${n}`, name:defaultReciterName(reciters.length+1) };
    commitReciters([...reciters,created]);
    setActiveId(created.id);
    setRenaming(true);
    setConfirmRemove(false);
  };

  const removeReciter=()=>{
    if(reciters.length<2) return;
    const remaining=reciters.filter(r=>r.id!==activeId);
    const going=activeId;
    // Tell the family's other devices, so a reciter removed here doesn't come
    // back from a phone that still has them. The removal sticks on the server.
    const fp = familyFingerprint(access);
    if(fp) pushReciter(fp,{ id:going, name:"", colored:{}, statuses:{}, statusAt:{}, dates:{},
      favorites:{}, ayahs:{}, workingOn:{}, practiceDays:[], honorific:"Hafizah", removed:true })
      .catch(()=>{ /* it will be sent again on the next sync */ });
    forgetProgress(activeId);
    commitReciters(remaining);
    setActiveId(remaining[Math.min(activeIndex,remaining.length-1)].id);
    setRenaming(false);
    setConfirmRemove(false);
  };

  const completedBooks = Object.keys(saved.colored).length;
  const totalBooks = juzs.reduce((a,j)=>a+j.surahs.length,0);
  const completeJuz = useMemo(()=>juzs.filter(j=>juzMemorized(j,saved.statuses||{})).length,[saved.statuses]);
  const pct = Math.round(completedBooks/totalBooks*100);
  const weekStart=useMemo(()=>{const d=new Date();const day=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day);return d},[]);
  const practicedThisWeek=(saved.practiceDays||[]).filter(day=>new Date(`${day}T12:00:00`)>=weekStart).length;
  const reviewedCount=Object.values(saved.statuses||{}).filter(v=>v==="practice").length;
  // Every badge keeps its description whether or not it has been earned, so the
  // card always says what the badge is for. The highlight already shows which
  // ones are won.
  const badges=[
    {icon:"☾",name:"First Light",earned:completedBooks>=1,note:"Select your first book"},
    {icon:"✦",name:"Shining Star",earned:completeJuz>=1,note:"Complete your first Juz"},
    {icon:"🏮",name:"Guiding Lantern",earned:practicedThisWeek>=3,note:"Practice 3 days in one week"},
    {icon:"✧",name:"Review Hero",earned:reviewedCount>=5,note:"Choose 5 books for muraja’ah"},
    {icon:"🕌",name:"Quran Garden",earned:completeJuz>=15,note:"Complete 15 Juz"},
    // The last badge on the shelf: the whole Quran, all 30 Juz.
    {icon:"📖",name:"Khatm al-Qur’an",earned:completeJuz>=30,note:"Memorize all 30 Juz"},
  ];
  const khatmDone = completeJuz>=30;
  /**
   * The day the whole Quran was finished. Saves made before this certificate
   * existed have no "khatm" date, so the last Juz date stands in for it.
   */
  const khatmDate = saved.dates[KHATM_KEY]
    || juzs.map(j=>saved.dates[j.n]).filter(Boolean).sort().pop()
    || localDay();
  const honorific = saved.honorific ?? "Hafizah";
  const setHonorific = (value:Honorific) => setSaved(s=>({...s,honorific:value}));
  const currentRange=pageGroups[activeGroup??0];
  const currentJuzs=juzs.filter(j=>j.n>=currentRange[0]&&j.n<=currentRange[1]);
  const rangeLabel=currentRange[0]===currentRange[1]?`Juz ${currentRange[0]}`:`Juz ${currentRange[0]}–${currentRange[1]}`;

  const openJuz=(n:number)=>{
    const group=pageGroups.findIndex(([from,to])=>n>=from&&n<=to);
    setActiveGroup(group<0?0:group);
    setOpenRow(n);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const goHome=()=>{ setActiveGroup(null); setOpenRow(null); setPracticeMode(false); setTourDemoNotes(false); window.scrollTo({top:0,behavior:"smooth"}); };
  /** Switches on the tour's practice-Juz page. Always lands on the home
   *  screen first, since that's where the practice page renders. */
  const startPractice=()=>{ goHome(); setPracticeMode(true); };
  /** The tour's "note the exact ayahs" step — opens the real Juz being shown
   *  off and, if nothing there is marked "learning" yet, also switches on the
   *  static example row so the ayah-note field is actually visible. */
  const startJuzNotes=(n:number)=>{ openJuz(n); setTourDemoNotes(true); };
  /** The tour's "try marking a status" step — practice page on, with one
   *  practice book's status dialog already open and labeled, so there's
   *  something concrete on screen rather than bare artwork. */
  const startPracticeStatus=()=>{ startPractice(); setPracticeStatusBook({key:"p-fatiha",name:"Al-Fatiha"}); };
  /** The tour's "try marking several at once" step — practice page on, with
   *  multi-select already switched on so the highlight lands on the actual
   *  four-option bar, not the inert "Mark several at once" button. */
  const startPracticeBulk=()=>{ startPractice(); setPracticeBulk(true); };
  /** The tour's certificate steps (preview, then the Hafiz/Hafizah toggle) —
   *  practice page on, all three practice books marked "in my heart," and the
   *  certificate preview already open, so there's a real certificate to be
   *  excited about rather than a button describing one. */
  const startPracticeCert=()=>{
    startPractice();
    setPracticeStatuses(s=>({...s,"p-fatiha":"memorized","p-asr":"memorized","p-ikhlas":"memorized"}));
    setPracticeCert(true);
  };
  const practiceToggle=(key:string)=>setPracticeStatuses(s=>s[key]?s:{...s,[key]:"learning"});
  const practiceChoose=(status:RevisionStatus)=>{
    if(!practiceStatusBook) return;
    setPracticeStatuses(s=>({...s,[practiceStatusBook.key]:status}));
    setPracticeStatusBook(null);
  };
  const practiceUnmark=()=>{
    if(!practiceStatusBook) return;
    const key=practiceStatusBook.key;
    setPracticeStatuses(s=>{const n={...s};delete n[key];return n});
    setPracticeAyahs(a=>{const n={...a};delete n[key];return n});
    setPracticeStatusBook(null);
  };
  const practiceTogglePicked=(key:string)=>setPracticePicked(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]);
  const practiceApply=(status:RevisionStatus)=>{
    if(!practicePicked.length) return;
    setPracticeStatuses(s=>{const n={...s};for(const k of practicePicked) n[k]=status;return n});
    setPracticeBulk(false);
    setPracticePicked([]);
  };
  const practiceUnmarkPicked=()=>{
    if(!practicePicked.length) return;
    setPracticeStatuses(s=>{const n={...s};for(const k of practicePicked) delete n[k];return n});
    setPracticeAyahs(a=>{const n={...a};for(const k of practicePicked) delete n[k];return n});
    setPracticeBulk(false);
    setPracticePicked([]);
  };
  const leavePracticeBulk=()=>{ setPracticeBulk(false); setPracticePicked([]); };

  /**
   * Which Juz the tour opens to show off the ayah-notes field. Whoever is
   * already learning something gets shown their own real entry; a brand-new
   * visitor with nothing started yet just sees Juz 1, where the empty state
   * explains itself ("tap a book above, and it'll appear here").
   */
  const learningKey=Object.entries(saved.statuses||{}).find(([,status])=>status==="learning")?.[0];
  const tourJuz=learningKey?Number(learningKey.split("-")[0]):1;

  /**
   * Selecting a book for the first time always starts it at "I'm learning
   * this" — never at a further-along status. Previously, if that book was the
   * last uncolored one in its Juz, it jumped straight to "It's in my heart",
   * which meant every single-surah Juz began at the wrong status on the very
   * first tap.
   */
  const toggle = (key:string) => setSaved(s=>{
    const colored={...s.colored};
    if(colored[key]) return s;
    colored[key]=color;
    return {
      ...s,
      colored,
      statuses:{...s.statuses,[key]:"learning"},
      statusAt:stampStatus(s.statusAt,[key]),
      practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()])),
    };
  });
  const chooseStatus=(status:RevisionStatus)=>{
    if(!statusBook)return;
    const {key,juz,name}=statusBook;
    // Worked out here, from current state, rather than inside the updater —
    // the updater runs during a later render, so anything it sets would still
    // be false by the time the lines below run.
    const whole=juzs.find(j=>j.n===juz);
    const nextStatuses={...saved.statuses,[key]:status};
    // A Juz is finished when its last surah reaches "It's in my heart".
    const justFinishedJuz=!!whole&&juzMemorized(whole,nextStatuses)&&!saved.dates[juz];
    // Finishing the last Juz finishes the Quran. That gets its own moment.
    const justFinishedQuran=justFinishedJuz&&juzs.every(j=>juzMemorized(j,nextStatuses))&&!saved.dates[KHATM_KEY];

    setSaved(s=>{
      const next:Saved={...s,statuses:{...s.statuses,[key]:status},statusAt:stampStatus(s.statusAt,[key]),practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()]))};
      if(justFinishedJuz) next.dates={...s.dates,[juz]:localDay()};
      if(justFinishedQuran) next.dates={...next.dates,[KHATM_KEY]:localDay()};
      return next;
    });
    setStatusBook(null);
    if(justFinishedQuran) setTimeout(()=>setCelebrating({khatm:true,juz:[juz]}),160);
    else if(justFinishedJuz) setTimeout(()=>setCelebrating({khatm:false,juz:[juz]}),160);
    // Finishing one surah is a good moment to ask what comes next in this Juz.
    else if(status==="memorized") setTimeout(()=>setNextUp({juz,name}),140);
  };

  /**
   * One status for every picked book. A family with ten Juz already memorized
   * should not have to tap each book twice and dismiss a certificate in
   * between, so nothing interrupts here: the whole change lands at once and a
   * single celebration follows, naming every Juz it finished.
   */
  const applyToPicked=(status:RevisionStatus)=>{
    if(!picked.length) return;
    const colored={...saved.colored},statuses={...saved.statuses},dates={...saved.dates};
    for(const key of picked) {
      if(!colored[key]) colored[key]=color;
      statuses[key]=status;
    }
    const finished=juzs.filter(j=>juzMemorized(j,statuses)&&!dates[j.n]).map(j=>j.n);
    for(const n of finished) dates[n]=localDay();
    const wholeQuran=juzs.every(j=>juzMemorized(j,statuses))&&!dates[KHATM_KEY];
    if(wholeQuran) dates[KHATM_KEY]=localDay();

    setSaved(s=>({...s,colored,statuses,dates,statusAt:stampStatus(s.statusAt,picked),
      practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()]))}));
    setBulk(false);
    setPicked([]);
    if(wholeQuran) setTimeout(()=>setCelebrating({khatm:true,juz:finished}),200);
    else if(finished.length) setTimeout(()=>setCelebrating({khatm:false,juz:finished}),200);
  };
  const togglePicked=(key:string)=>setPicked(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]);
  const leaveBulk=()=>{ setBulk(false); setPicked([]); };
  /**
   * The bulk equivalent of unmarkBook — puts every picked book back to
   * blank in one go. Exists so an accidental multi-mark (wrong profile,
   * fat-fingered "pick all") has a way back that doesn't mean tapping each
   * book individually.
   */
  const unmarkPicked=()=>{
    if(!picked.length) return;
    const colored={...saved.colored},statuses={...saved.statuses},dates={...saved.dates};
    const affectedJuz=new Set(picked.map(key=>Number(key.split("-")[0])));
    for(const key of picked) { delete colored[key]; delete statuses[key]; }
    for(const n of affectedJuz) delete dates[n];
    delete dates[KHATM_KEY];
    setSaved(s=>({...s,colored,statuses,dates,statusAt:stampStatus(s.statusAt,picked)}));
    setBulk(false);
    setPicked([]);
  };
  /**
   * Take a book back to blank. The stamp is still moved forward, so that the
   * undo travels to the family's other devices instead of being quietly
   * reversed by whichever of them last saw the book marked.
   */
  const unmarkBook=()=>{if(!statusBook)return;setSaved(s=>{const colored={...s.colored},statuses={...s.statuses},dates={...s.dates};delete colored[statusBook.key];delete statuses[statusBook.key];delete dates[statusBook.juz];delete dates[KHATM_KEY];return {...s,colored,statuses,dates,statusAt:stampStatus(s.statusAt,[statusBook.key])}});setStatusBook(null)};
  const update = (field:"name"|"dates"|"favorites", key:string, value:string) => setSaved(s=> field==="name" ? {...s,name:value} : {...s,[field]:{...s[field],[key]:value}});
  const updateAyahs = (key:string,value:string) => setSaved(s=>({...s,ayahs:{...s.ayahs,[key]:value}}));
  /** Marking a book as being learned is how a family says "this is what we're on". */
  const startLearning = (key:string) => setSaved(s=>({...s,statuses:{...s.statuses,[key]:"learning"},statusAt:stampStatus(s.statusAt,[key]),practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()]))}));

  /**
   * Saving and restoring a copy by hand.
   *
   * Progress travels between a family's devices on its own once they have a
   * licence key, but the free week is device-only by design, and some people
   * simply want a copy they hold themselves. Everything the app stores is
   * included — every reciter and their books.
   */
  const exportProgress = () => {
    const data:Record<string,string> = {};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key?.startsWith("quran-tracker-")&&key!=="quran-tracker-access") data[key]=localStorage.getItem(key)!;
    }
    const blob=new Blob([JSON.stringify({app:"One Ayah At A Time",saved:localDay(),data},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`one-ayah-progress-${localDay()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const [restored,setRestored] = useState("");

  /**
   * Signing this device out.
   *
   * There was no way to do this at all, which mattered more than it looks: a
   * mistyped key, a shared laptop, a device being handed on, or somebody simply
   * wanting to move their subscription somewhere else all had no answer but the
   * browser's developer tools.
   *
   * It clears the way in and nothing else. **Every book stays exactly where it
   * is** — access and progress have always been stored separately, and this is
   * the moment that separation earns its keep. Saying so on the button matters
   * as much as the behaviour: nobody will press a button they think deletes a
   * year of memorization.
   */
  const [signingOut,setSigningOut] = useState(false);
  const signOut = () => {
    // There is nothing to tell the shop: Gumroad has no per-device activation to
    // hand back, so signing out is entirely a matter for this device.
    writeAccess({});
    setAccess({});
    setSigningOut(false);
  };
  const importProgress = (file:File) => {
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const parsed=JSON.parse(String(reader.result)) as {app?:string;data?:Record<string,string>};
        if(parsed.app!=="One Ayah At A Time"||!parsed.data) throw new Error("not ours");
        for(const [key,value] of Object.entries(parsed.data)){
          if(key.startsWith("quran-tracker-")&&key!=="quran-tracker-access") localStorage.setItem(key,value);
        }
        setRestored("Loaded. Opening your books…");
        setTimeout(()=>window.location.reload(),700);
      } catch {
        setRestored("That file didn’t look like a One Ayah backup.");
      }
    };
    reader.readAsText(file);
  };

  // Everything below this line is for people who may actually use the app.
  if(!hasAccess(access)) return <Gate
    state={gateState==="ended"?"ended":gateState==="trial-over"?"trial-over":"new"}
    onStartTrial={()=>saveAccess({...access,trialStart:Date.now()})}
    onUnlock={licence=>saveAccess({...access,licence})}
    onCode={code=>saveAccess({...access,code})}/>;

  return <main>
    <section className="experience">
      {gateState==="trial" && daysLeft!==null && <p className="trial-strip">
        <span>☾</span>
        <strong>{daysLeft} {daysLeft===1?"day":"days"} left</strong> of your free week — everything is
        unlocked, certificates included.
        <a href={buyHref("family")}>Get it for {PLANS.family.price}</a>
      </p>}
      <header className={`app-titlebar ${onHome?"":"compact"}`}>
        <div className="app-brand"><img className="brand-moon" src={asset("logo-icon.png")} alt="One Ayah At A Time"/><div><p>ONE AYAH AT A TIME</p><h1>Your <span>journey</span></h1></div></div>
        <div className="child-switch" aria-label="Choose a reciter">
          <span>Whose journey?</span>
          <div>
            {reciters.map(r=><button key={r.id} className={activeId===r.id?"selected":""} onClick={()=>{setActiveId(r.id);setRenaming(false);setConfirmRemove(false)}}>{r.name}</button>)}
            <button type="button" className="add-reciter" onClick={addReciter} title="Add another reciter">+ Add reciter</button>
          </div>
          {renaming
            ? <form className="learner-rename" onSubmit={e=>{e.preventDefault();setRenaming(false);setConfirmRemove(false)}}>
                <label htmlFor="reciter-name">Nickname</label>
                <input id="reciter-name" autoFocus maxLength={MAX_NAME} value={reciter}
                  onChange={e=>renameReciter(e.target.value)}
                  placeholder={defaultReciterName(activeIndex+1)}/>
                <button type="submit">Done</button>
                <small>A nickname is perfect — there’s no need for a full name.</small>
                {/*
                  Nothing about a reciter is guessed. The only word in the whole
                  app that changes with who is reciting is the one on the Khatm
                  certificate, so it is asked for once, here, beside the name.
                */}
                <fieldset className="honorific-choice">
                  <legend>On the Khatm al-Qur’an certificate, call {reciter}</legend>
                  {(["Hafizah","Hafiz"] as Honorific[]).map(option=>
                    <button key={option} type="button" className={honorific===option?"selected":undefined}
                      aria-pressed={honorific===option} onClick={()=>setHonorific(option)}>{option}</button>)}
                  <small>Hafizah for a girl, Hafiz for a boy.</small>
                </fieldset>
                {reciters.length>1&&(confirmRemove
                  ? <p className="remove-confirm">Remove {reciter} and their books? <button type="button" className="danger" onClick={removeReciter}>Yes, remove</button> <button type="button" onClick={()=>setConfirmRemove(false)}>Keep</button></p>
                  : <button type="button" className="remove-reciter" onClick={()=>setConfirmRemove(true)}>Remove this reciter</button>)}
              </form>
            : <button type="button" className="rename-learner" onClick={()=>setRenaming(true)}>Rename {reciter}</button>}
          <small><i className={syncStatus.includes("won’t let")?"error":""}/> {
            syncStatus.includes("won’t let") ? syncStatus
            : syncLine==="ok"      ? "Saved on all your devices"
            : syncLine==="working" ? "Saving…"
            : syncStatus
          }</small>
        </div>
      </header>

      {/*
        Shown on the home screen only. Inside a Juz these push the artwork —
        the thing you actually came to use — a long way down the page.

        The bar counts books, where every surah counts once. That is not the
        same as how much of the Quran is memorized — Juz 30 alone is 37 of the
        116 books — so it is labelled as books, with the Juz count beside it.
      */}
      {onHome && <>
        <div className="journey-strip" aria-label="Overall memorization progress">
          <div className="progress-copy"><div><span className="tiny">{reciter.toUpperCase()}’S JOURNEY</span><strong>{completedBooks} of {totalBooks} books started</strong></div><span>{completeJuz} of 30 Juz memorized</span></div>
          <div className="progress" title={`Every book you have begun counts here, whatever its status. Each surah counts once, so short surahs move this as much as long ones.`} aria-label={`${completedBooks} of ${totalBooks} books started.`}><i style={{width:`${pct}%`}}/></div>
          <div className="gentle-streak">☾ You practiced <strong>{practicedThisWeek} {practicedThisWeek===1?"day":"days"}</strong> this week</div>
          {/* Once the whole Quran is memorized the certificate stays one tap away. */}
          {khatmDone&&<button type="button" className="khatm-link" onClick={()=>setCertificate(KHATM_KEY)}>📖 Khatm al-Qur’an — view {reciter}’s certificate</button>}
        </div>

        <section className="achievement-card" aria-label={`${reciter}'s achievements`}><div><span className="tiny">A GROWING COLLECTION</span><h2>{reciter}’s achievements</h2></div><div className="badges">{badges.map(b=><div key={b.name} className={`badge ${b.earned?"earned":"locked"}`} title={b.earned?`${b.name} earned!`:b.note}><span>{b.icon}</span><b>{b.name}</b><small>{b.note}</small></div>)}</div></section>

        {practiceMode && <PracticeArea
          statuses={practiceStatuses}
          bulk={practiceBulk}
          picked={practicePicked}
          onToggle={practiceToggle}
          onOpenStatus={(key,name)=>setPracticeStatusBook({key,name})}
          onPick={practiceTogglePicked}
          onStartBulk={()=>setPracticeBulk(true)}
          onLeaveBulk={leavePracticeBulk}
          onApply={practiceApply}
          onUnmark={practiceUnmarkPicked}
          allMemorized={practiceAllMemorized}
          onPreviewCertificate={()=>setPracticeCert(true)}
        />}
      </>}

      {onHome ? <>
        <MemorizingNow saved={saved} openJuz={openJuz}/>
        <section className="juz-overview" aria-label="All 30 Juz">
          <div className="tracker-top"><h2>Choose a Juz</h2></div>
          <div className="juz-tiles">
            {juzs.map(juz=>{
              const total=juz.surahs.length;
              const done=juz.surahs.filter(n=>saved.colored[`${juz.n}-${n}`]).length;
              const memorized=juzMemorized(juz,saved.statuses||{});
              const learning=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="learning").length;
              return <button key={juz.n} className={`juz-tile ${memorized?"complete":done?"started":""}`} onClick={()=>openJuz(juz.n)}
                aria-label={`Juz ${juz.n}${juz.label?`, ${juz.label}`:""} — ${done} of ${total} ${bookWord(total)} started${memorized?", all memorized":""}`}>
                <span className="tile-top"><small>JUZ</small><strong>{juz.n}</strong></span>
                {juz.label&&<em className="tile-label">{juz.label}</em>}
                <span className="tile-meter" aria-hidden="true"><i style={{width:`${done/total*100}%`}}/></span>
                <span className="tile-count">{memorized?"✓ Memorized":`${done} of ${total} ${bookWord(total)}`}</span>
                {learning>0&&<span className="tile-working"><JourneyIcon status="learning"/>{learning} learning</span>}
              </button>;
            })}
          </div>
        </section>
      </> : <>
        <nav className="juz-nav" aria-label="Choose a Juz">
          <button className="back-home" onClick={goHome} aria-label="Back to all 30 Juz">‹ All Juz</button>
          {pageGroups.map((range,i)=>{const grouped=juzs.filter(j=>j.n>=range[0]&&j.n<=range[1]),done=grouped.every(j=>juzMemorized(j,saved.statuses||{})),label=range[0]===range[1]?`${range[0]}`:`${range[0]}–${range[1]}`;return <button key={label} className={`${activeGroup===i?"active":""} ${done?"done":""}`} onClick={()=>{setActiveGroup(i);setOpenRow(null)}} aria-current={activeGroup===i?"page":undefined} aria-label={`Juz ${label}`}><small>Juz</small><strong>{label}</strong><span>{done?"✓":""}</span></button>})}
        </nav>

        <div className="tracker-top">
          <h2>{rangeLabel}</h2>
          <div className="tools"><span>Illuminate <small>(choose its colors)</small></span>{colorOptions.map(option=><button key={option.value} aria-label={`Choose ${option.label}`} title={option.label} aria-pressed={color===option.value} className={`swatch ${option.background?"blend-swatch":""}`} onClick={()=>setColor(option.value)} style={{background:option.background||option.value}}/>)}</div>
        </div>
        <IllustratedTracker juzs={currentJuzs} saved={saved} toggle={toggle} update={update} updateAyahs={updateAyahs} openStatus={setStatusBook} openCertificate={setCertificate} openRow={openRow} setOpenRow={setOpenRow}
          bulk={bulk} picked={picked} onPick={togglePicked} onPickAll={setPicked} onApply={applyToPicked} onUnmark={unmarkPicked} onStartBulk={()=>setBulk(true)} onLeaveBulk={leaveBulk}
          tourDemoJuz={tourDemoNotes?tourJuz:undefined}/>
      </>}
    </section>

    {statusBook&&<div className="modal-backdrop" onMouseDown={()=>setStatusBook(null)}><section className="status-dialog" role="dialog" aria-modal="true" aria-label={`Revision status for ${statusBook.name}`} onMouseDown={e=>e.stopPropagation()}><button className="close-x" onClick={()=>setStatusBook(null)}>×</button><img className="status-masjid" src={asset("status-art/status-masjid.png")} alt="Watercolor masjid"/><p className="eyebrow">HOW IS THIS SURAH GOING?</p><h2>{statusBook.name}</h2><p>Choose a gentle reminder for your journey.</p><div className="status-choices">{journeyOrder.map(status=><button key={status} className={saved.statuses[statusBook.key]===status?"selected":undefined} aria-pressed={saved.statuses[statusBook.key]===status} onClick={()=>chooseStatus(status)}><JourneyIcon status={status}/><b>{statusMeta[status].label}</b>{statusMeta[status].hint&&<small className="status-hint">{statusMeta[status].hint}</small>}</button>)}<button className="status-reset" onClick={unmarkBook}><BlankBookIcon/><b>I haven’t started this yet</b><small className="status-hint">Puts this book back to blank so it can be illuminated again whenever you like.</small></button></div></section></div>}

    {practiceStatusBook&&<div className="modal-backdrop" onMouseDown={()=>setPracticeStatusBook(null)}><section className="status-dialog" role="dialog" aria-modal="true" aria-label={`Practice status for ${practiceStatusBook.name}`} onMouseDown={e=>e.stopPropagation()}><button className="close-x" onClick={()=>setPracticeStatusBook(null)}>×</button><p className="eyebrow">PRACTICE — NOTHING IS SAVED</p><h2>{practiceStatusBook.name}</h2><p>Try any status you like — this is just for practice.</p><div className="status-choices">{journeyOrder.map(status=><button key={status} className={practiceStatuses[practiceStatusBook.key]===status?"selected":undefined} aria-pressed={practiceStatuses[practiceStatusBook.key]===status} onClick={()=>practiceChoose(status)}><JourneyIcon status={status}/><b>{statusMeta[status].label}</b>{statusMeta[status].hint&&<small className="status-hint">{statusMeta[status].hint}</small>}</button>)}<button className="status-reset" onClick={practiceUnmark}><BlankBookIcon/><b>I haven’t started this yet</b><small className="status-hint">Puts this practice book back to blank so you can try again.</small></button></div>{practiceStatuses[practiceStatusBook.key]&&<label className="practice-ayah-field"><span>Try jotting the exact ayahs</span><input value={practiceAyahs[practiceStatusBook.key]||""} onChange={e=>setPracticeAyahs(a=>({...a,[practiceStatusBook.key]:e.target.value}))} placeholder="Ayahs, e.g. 1–7"/></label>}</section></div>}

    {practiceCert&&<div className="certificate-screen practice-certificate" role="dialog" aria-modal="true"><div className="certificate"><button className="close-x no-print" onClick={()=>setPracticeCert(false)}>×</button><p className="practice-watermark">PRACTICE CERTIFICATE — NOTHING IS SAVED</p><div className="cert-stars">✦ · ★ · ✦ · ★ · ✦</div><img className="cert-top-moon" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon"/><p>CERTIFICATE OF QURAN MEMORIZATION</p><h2>MashaAllah!</h2><span>This certificate celebrates</span><h1>you</h1><span>for completing</span><h3>this practice Juz</h3><p className="cert-honorific">This is what it will look like when you finish — shown as a{" "}{(["Hafizah","Hafiz"] as Honorific[]).map(option=><button key={option} type="button" className={practiceHonorific===option?"selected":undefined} aria-pressed={practiceHonorific===option} onClick={()=>setPracticeHonorific(option)}>{option}</button>)}</p><div className="cert-dua">May Allah fill your heart with the light of the Quran.</div></div></div>}

    {nextUp&&(()=>{const juz=juzs.find(j=>j.n===nextUp.juz)!;const remaining=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]!=="memorized");return <div className="modal-backdrop" onMouseDown={()=>setNextUp(null)}><section className="status-dialog next-up" role="dialog" aria-modal="true" aria-label="Choose what to memorize next" onMouseDown={e=>e.stopPropagation()}><button className="close-x" onClick={()=>setNextUp(null)}>×</button><JourneyIcon status="memorized" className="next-up-star"/><p className="eyebrow">MASHAALLAH!</p><h2>{nextUp.name} is in your heart</h2><p>{remaining.length?`What would you like to work on next in Juz ${juz.n}?`:`That was the last surah in Juz ${juz.n}. Beautiful work.`}</p>{remaining.length>0&&<div className="next-choices">{remaining.map(n=><button key={n} onClick={()=>{startLearning(`${juz.n}-${n}`);setNextUp(null)}}><JourneyIcon status="learning"/><span>{surahs[n-1].en}</span></button>)}</div>}
      {/* Nothing was offered when the Juz is already finished, so declining it makes no sense. */}
      <button className="unmark" onClick={()=>setNextUp(null)}>{remaining.length?"Not right now":"Done"}</button></section></div>})()}

    {celebrating&&(()=>{
      const {khatm,juz}=celebrating;
      // The whole Quran gets a fuller, gold fall. No sound, ever.
      const pieces=khatm?56:28;
      return <div className="celebration" role="dialog" aria-modal="true">
        <div className={`confetti ${khatm?"grand":""}`} aria-hidden="true">{Array.from({length:pieces},(_,i)=><i key={i} style={confettiPiece(i,khatm)}>{i%3===0?"★":i%3===1?"✦":"●"}</i>)}</div>
        <div className="celebrate-card">
          <img className="glow-lantern" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon and lantern"/>
          <p className="eyebrow">{khatm?"THE WHOLE QURAN":"A BEAUTIFUL MILESTONE"}</p>
          <h2>MashaAllah, {reciter}!</h2>
          <p>{khatm
            ? "You have memorized all 30 Juz — the whole Quran. May it stay bright in your heart for the rest of your life."
            : `You completed Juz ${listWords(juz)}. May every ayah stay bright in your heart.`}</p>
          <div>
            {khatm
              ? <button onClick={()=>{setCertificate(KHATM_KEY);setCelebrating(null)}}>See my certificate</button>
              : juz.length>1
                ? juz.map(n=><button key={n} onClick={()=>{setCertificate(n);setCelebrating(null)}}>Juz {n} certificate</button>)
                : <button onClick={()=>{setCertificate(juz[0]);setCelebrating(null)}}>See my certificate</button>}
            <button className="quiet" onClick={()=>setCelebrating(null)}>Keep exploring</button>
          </div>
        </div>
      </div>;
    })()}

    {certificate&&(()=>{
      const khatm=certificate===KHATM_KEY;
      const day=khatm?khatmDate:saved.dates[certificate];
      const shown=new Date(`${day}T12:00:00`).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
      return <div className={`certificate-screen ${khatm?"khatm":""}`} role="dialog" aria-modal="true"><div className="certificate"><button className="close-x no-print" onClick={()=>setCertificate(null)}>×</button><div className="cert-stars">✦ · ★ · ✦ · ★ · ✦</div><img className="cert-top-moon" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon"/><p>CERTIFICATE OF QURAN MEMORIZATION</p><h2>{khatm?"Khatm al-Qur’an":"MashaAllah!"}</h2><span>This certificate celebrates</span><h1>{reciter}</h1><span>{khatm?"who has memorized all 30 Juz and":"for completing"}</span><h3>{khatm?`has become a ${honorific}`:`Juz ${certificate}`}</h3><p className="cert-date">Completed {shown}</p>{khatm&&<p className="cert-honorific no-print">Show this certificate as{" "}{(["Hafizah","Hafiz"] as Honorific[]).map(option=><button key={option} type="button" className={honorific===option?"selected":undefined} aria-pressed={honorific===option} onClick={()=>setHonorific(option)}>{option}</button>)}</p>}<div className="cert-dua">{khatm?"May Allah make the Quran the light of your heart and your companion always.":"May Allah fill your heart with the light of the Quran."}</div><div className="cert-art"><img src={asset("status-art/learning-moon.png")} alt=""/><img src={asset("status-art/memorized-star.png")} alt=""/><img className="cert-masjid" src={asset("status-art/status-masjid.png")} alt=""/><img src={asset("status-art/memorized-star.png")} alt=""/><img src={asset("status-art/learning-moon.png")} alt=""/></div><button className="print-button no-print" onClick={()=>window.print()}>Print or save certificate</button></div></div>;
    })()}

    {tour&&<Tour onDone={()=>setTour(false)} openJuz={startJuzNotes} goHome={goHome}
      startPracticeStatus={startPracticeStatus} startPracticeBulk={startPracticeBulk} startPracticeCert={startPracticeCert}
      tourJuz={tourJuz}/>}
    <footer>
      <p className="footer-dua"><span>☾</span> May every ayah bring your heart closer to the Quran. <span>♥</span></p>
      <div className="footer-backup">
        <button type="button" onClick={exportProgress}>Save a copy of your progress</button>
        <button type="button" onClick={()=>{markTourSeen();setTour(true)}}>Show me around</button>
        <label className="restore">
          Load a saved copy
          <input type="file" accept="application/json,.json"
            onChange={e=>{ const f=e.target.files?.[0]; if(f) importProgress(f); e.target.value="" }}/>
        </label>
        {restored&&<small role="status">{restored}</small>}
      </div>
      <div className="footer-signout">
        {signingOut
          ? <p className="signout-confirm">Sign this device out? <strong>Your books stay exactly where
              they are</strong> — you can sign back in with the same key any time.{" "}
              <button type="button" className="danger" onClick={signOut}>Yes, sign out</button>{" "}
              <button type="button" onClick={()=>setSigningOut(false)}>Stay signed in</button></p>
          : <button type="button" className="signout" onClick={()=>setSigningOut(true)}>
              Sign out or use a different key</button>}
      </div>
      <small className="footer-note">{syncLine==="off"
        ? <>Your books are saved in this browser. Once you have a licence key they travel to your
            other devices on their own — and you can always save a copy to keep.</>
        : syncLine==="ok" ? <>Up to date on all your devices.</>
        : syncLine==="working" ? <>Catching up with your other devices…</>
        : syncLine==="offline" ? <>No connection right now. Your books are safe here and will catch up later.</>
        : <>Your books are safe here. They will catch up with your other devices shortly.</>}</small>
      <GateFooter/>
    </footer>
  </main>
}

/**
 * Everything being memorized right now, gathered from every Juz into one place
 * on the home screen. Without this a family has to open all eight artwork pages
 * to remember what they were working on.
 */
/**
 * Everything being learned right now, gathered from every Juz. These are the
 * books marked "I'm learning this" — there is no separate list to maintain.
 * Rendered as the same compact chips used in "This Juz, book by book", since a family can
 * end up with a lot of them at once.
 */
function MemorizingNow({saved,openJuz}:{saved:Saved;openJuz:(n:number)=>void}) {
  const items:{key:string;juz:number;name:string;ayahs:string}[]=[];
  for(const juz of juzs) {
    for(const n of juz.surahs) {
      const key=`${juz.n}-${n}`;
      if(saved.statuses[key]!=="learning") continue;
      items.push({key,juz:juz.n,name:surahs[n-1].en,ayahs:saved.ayahs[key]||""});
    }
  }

  return <section className="memorizing-now" aria-label="Currently memorizing">
    <div className="tracker-top"><h2>Currently memorizing</h2></div>
    {items.length===0
      ? <p className="memorizing-empty"><JourneyIcon status="learning"/><span>Nothing yet. Select a book in any Juz and it will appear here while you learn it.</span></p>
      : <div className="memorizing-list">{items.map(item=>
          <button className="memorizing-chip" key={item.key} onClick={()=>openJuz(item.juz)}
            title={`Open Juz ${item.juz}`}>
            <JourneyIcon status="learning"/>
            <b>{item.name}</b>
            <small>Juz {item.juz}{item.ayahs?` · ${item.ayahs}`:""}</small>
          </button>)}
        </div>}
  </section>;
}

/**
 * The tour's temporary practice-Juz page. Three example books on Kathryn's
 * "PRACTICE • TOUR ONLY" artwork, wired to the same status dialog, multi-select
 * bar and certificate look as a real Juz — but backed entirely by `practice*`
 * state in `Home`, never `saved`, so nothing here is ever written to storage.
 */
function PracticeArea({statuses,bulk,picked,onToggle,onOpenStatus,onPick,onStartBulk,onLeaveBulk,onApply,onUnmark,allMemorized,onPreviewCertificate}:{
  statuses:Record<string,RevisionStatus>;
  bulk:boolean;
  picked:string[];
  onToggle:(key:string)=>void;
  onOpenStatus:(key:string,name:string)=>void;
  onPick:(key:string)=>void;
  onStartBulk:()=>void;
  onLeaveBulk:()=>void;
  onApply:(status:RevisionStatus)=>void;
  onUnmark:()=>void;
  allMemorized:boolean;
  onPreviewCertificate:()=>void;
}) {
  return <section className="tour-practice integrated-tracker" aria-label="Practice Juz — for trying the tour, nothing saved">
    <div className="tracker-top"><h2>Try it yourself</h2><span className="practice-badge">PRACTICE · NOTHING IS SAVED</span></div>
    <div className="interactive-art">
      <img src={asset("tour-practice.jpg")} alt="Practice Juz page with three example books: Al-Fatiha, Al-Asr and Al-Ikhlas, labeled practice, tour only"/>
      {PRACTICE_BOOKS.map(book=>{
        const status=statuses[book.key];
        return <button key={book.key}
          className={`art-book ${status?"filled":""} status-${status||"none"} ${bulk&&picked.includes(book.key)?"picked":""}`}
          style={{left:`${book.rect[0]}%`,top:`${book.rect[1]}%`,width:`${book.rect[2]}%`,height:`${book.rect[3]}%`}}
          onClick={()=>bulk?onPick(book.key):status?onOpenStatus(book.key,book.name):onToggle(book.key)}
          aria-pressed={bulk?picked.includes(book.key):!!status}
          aria-label={`${bulk?`${picked.includes(book.key)?"Unpick":"Pick"}`:status?"Set practice status for":"Mark"} ${book.name}`}
          title={bulk?`${book.name} — tap to pick`:status?`${book.name} — ${statusMeta[status].label}`:`${book.name} — tap to try`}>
          {status&&<JourneyIcon status={status}/>}
        </button>;
      })}
    </div>
    <div className="art-actions">
      {bulk
        ? <div className="bulk-bar" role="group" aria-label="Mark several practice books at once">
            <p><strong>{picked.length} picked</strong> — tap the practice books above, then choose one status for all of them.</p>
            <div className="bulk-choices">
              {journeyOrder.map(status=>
                <button key={status} disabled={!picked.length} onClick={()=>onApply(status)}>
                  <JourneyIcon status={status}/><b>{statusMeta[status].label}</b>
                </button>)}
              <button disabled={!picked.length} onClick={onUnmark}><BlankBookIcon/><b>I haven’t started this yet</b></button>
            </div>
            <div className="bulk-tools"><button type="button" className="quiet" onClick={onLeaveBulk}>Done</button></div>
          </div>
        : <>
            <p className="tap-hint"><span>✦</span> Tap a practice book to try marking it <span>✦</span></p>
            <button type="button" className="bulk-start" onClick={onStartBulk}>Mark several at once</button>
          </>}
    </div>
    {allMemorized&&<button type="button" className="practice-cert-preview" onClick={onPreviewCertificate}>📖 Preview the certificate</button>}
  </section>;
}

function IllustratedTracker({juzs,saved,toggle,update,updateAyahs,openStatus,openCertificate,openRow,setOpenRow,bulk,picked,onPick,onPickAll,onApply,onUnmark,onStartBulk,onLeaveBulk,tourDemoJuz}:{juzs:Juz[];saved:Saved;toggle:(k:string)=>void;update:(f:"dates"|"favorites",k:string,v:string)=>void;updateAyahs:(key:string,value:string)=>void;openStatus:(book:{key:string;name:string;juz:number})=>void;openCertificate:(juz:number)=>void;openRow:number|null;setOpenRow:(n:number|null)=>void;bulk:boolean;picked:string[];onPick:(key:string)=>void;onPickAll:(keys:string[])=>void;onApply:(status:RevisionStatus)=>void;onUnmark:()=>void;onStartBulk:()=>void;onLeaveBulk:()=>void;
  /** Set only by the tour's "note the exact ayahs" step, and only while this
   *  Juz has nothing genuinely marked "learning" — shows one static example
   *  row (not wired to real storage) so the field is actually visible. */
  tourDemoJuz?:number}) {
  const first=juzs[0],crop=cropForJuz(first.n),groupLabel=juzs.length===1?`Juz ${first.n}`:`Juz ${first.n}–${juzs[juzs.length-1].n}`;
  const pageKeys=juzs.flatMap(juz=>juz.surahs.map(n=>`${juz.n}-${n}`));
  const allPicked=picked.length===pageKeys.length&&pageKeys.every(k=>picked.includes(k));
  return <div className="integrated-tracker">
    <div className={`interactive-art ${first.n===30?"wide-art":""}`}>
      <ArtCanvas juzs={juzs} saved={saved}/>
      {juzs.flatMap(juz=>juz.surahs.map((n,i)=>{const s=surahs[n-1],key=`${juz.n}-${n}`,fill=saved.colored[key],status=saved.statuses[key]||(fill?"learning":undefined),r=juz.n!==30&&isolatedInteractionKeys.has(key)?targetedPaintRects[key]:fullBookRect(juz.n,bookRects[juz.n][i]),ir=iconRects[key];return <button key={key} className={`art-book ${fill?"filled":""} status-${status||"none"} ${bulk&&picked.includes(key)?"picked":""}`} style={{left:`${r[0]}%`,top:`${r[1]/crop*100}%`,width:`${r[2]}%`,height:`${r[3]/crop*100}%`,"--fill":fill||"#e05287"} as React.CSSProperties} onClick={()=>bulk?onPick(key):fill?openStatus({key,name:s.en,juz:juz.n}):toggle(key)} aria-pressed={bulk?picked.includes(key):!!fill} aria-label={bulk?`${picked.includes(key)?"Unpick":"Pick"} ${s.en} in Juz ${juz.n}`:`${fill?`Set revision status for ${s.en}`:`Mark ${s.en}`} in Juz ${juz.n}`} title={bulk?`${s.en} — tap to pick`:fill?`${s.en} — ${statusMeta[status!].label}`:`${s.en} — tap to color`}>{fill&&<JourneyIcon status={status!} style={ir?{left:`${(ir[0]-r[0])/r[2]*100}%`,top:`${(ir[1]-r[1])/r[3]*100}%`,width:`${ir[2]/r[2]*100}%`,height:`${ir[3]/r[3]*100}%`}:undefined}/>}</button>}))}
    </div>
    {/*
      Marking several at once. Ten memorized Juz used to mean tapping every
      book, choosing a status, then closing a certificate — over and over.
      Here the taps only pick books; one button then sets them all.
    */}
    <div className="art-actions">
      {bulk
        ? <div className="bulk-bar" role="group" aria-label="Mark several books at once">
            <p><strong>{picked.length} {bookWord(picked.length)} picked</strong> — tap the books in the artwork, then choose one status for all of them.</p>
            <div className="bulk-choices">
              {journeyOrder.map(status=>
                <button key={status} disabled={!picked.length} onClick={()=>onApply(status)}>
                  <JourneyIcon status={status}/><b>{statusMeta[status].label}</b>
                </button>)}
              <button disabled={!picked.length} onClick={onUnmark}>
                <BlankBookIcon/><b>I haven’t started this yet</b>
              </button>
            </div>
            <div className="bulk-tools">
              <button type="button" onClick={()=>onPickAll(allPicked?[]:pageKeys)}>
                {allPicked?"Pick none":`Pick all ${pageKeys.length} on this page`}
              </button>
              <button type="button" className="quiet" onClick={onLeaveBulk}>Done</button>
            </div>
          </div>
        : <>
            <p className="tap-hint"><span>✦</span> Tap any book in the artwork to begin <span>✦</span></p>
            <button type="button" className="bulk-start" onClick={onStartBulk}>Mark several at once</button>
          </>}
    </div>
    <div className="group-notes" aria-label={`${groupLabel} completion details`}>
      {juzs.map(juz=>{
        // Each Juz collapses to a single summary line. Eight artwork pages of
        // fully expanded detail made the page overwhelmingly long.
        const expanded=openRow===juz.n;
        const colored=juz.surahs.filter(n=>saved.colored[`${juz.n}-${n}`]).length;
        const learning=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="learning").map(n=>surahs[n-1].en);
        const inHeart=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="memorized").length;
        const revising=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="practice").length;
        const summary=[
          `${colored} of ${juz.surahs.length} ${bookWord(juz.surahs.length)} started`,
          learning.length?`learning ${learning.slice(0,2).join(", ")}${learning.length>2?` +${learning.length-2}`:""}`:null,
          revising?`${revising} in muraja’ah`:null,
          inHeart?`${inHeart} in my heart`:null,
        ].filter(Boolean).join(" · ");
        return <div className={`juz-note-row ${expanded?"expanded":"collapsed"}`} key={juz.n}>
        <button type="button" className="row-toggle" aria-expanded={expanded} onClick={()=>setOpenRow(expanded?null:juz.n)}>
          <b>Juz {juz.n}</b><span className="row-summary">{summary}</span><span className="row-chevron" aria-hidden="true">{expanded?"▾":"▸"}</span>
        </button>
        {expanded&&<div className="row-body">
          <div className="row-facts">
            <div className="auto-date"><JourneyIcon status="memorized"/><div>Date memorized<strong>{saved.dates[juz.n]?new Date(`${saved.dates[juz.n]}T12:00:00`).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}):"Added once every book is in your heart"}</strong>{saved.dates[juz.n]&&<button className="certificate-link" onClick={()=>openCertificate(juz.n)}>View certificate</button>}</div></div>
            <label><span>♥</span><div>Favorite Surah<input value={saved.favorites[juz.n]||""} onChange={e=>update("favorites",String(juz.n),e.target.value)} placeholder="Write a favorite…"/></div></label>
          </div>

          {/*
            Every book marked "I'm learning this" appears here with its own
            ayah box. There used to be a dropdown and a single note for the
            whole Juz, which meant a Juz could only remember one surah, and
            marking a book as being learned did not show up here at all.
          */}
          <div className="current-work"><JourneyIcon status="learning"/><div>
            <strong>Currently memorizing</strong>
            {(()=>{
              const learning=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="learning");
              if(!learning.length) {
                if(tourDemoJuz===juz.n) {
                  // A static example, not wired to real storage: shows what
                  // this field looks like without touching real progress.
                  const example=surahs[juz.surahs[0]-1].en;
                  return <div className="work-list demo-work">
                    <div className="work-row">
                      <b>{example}</b>
                      <input aria-label={`Example ayahs for ${example}`} value="1–5" readOnly tabIndex={-1}/>
                    </div>
                    <small className="demo-tag">Example — set a book to “I’m learning this” for your own</small>
                  </div>;
                }
                return <p className="work-empty">Nothing yet. Tap a book in the artwork above, or set one to <em>I’m learning this</em>, and it will appear here with a place for its ayahs.</p>;
              }
              return <div className="work-list">{learning.map(n=>{
                const key=`${juz.n}-${n}`;
                return <div className="work-row" key={key}>
                  <b>{surahs[n-1].en}</b>
                  <input aria-label={`Ayahs being memorized in ${surahs[n-1].en}`} value={saved.ayahs[key]||""} onChange={e=>updateAyahs(key,e.target.value)} placeholder="Ayahs, e.g. 1–5"/>
                </div>;
              })}</div>;
            })()}
          </div></div>

          <div className="book-journey"><strong>This Juz, book by book</strong>{(()=>{const done=juz.surahs.filter(n=>saved.colored[`${juz.n}-${n}`]);if(!done.length) return <div className="journey-empty"><em>Select a book to begin its journey.</em></div>;return journeyOrder.map(group=>{const items=done.filter(n=>(saved.statuses[`${juz.n}-${n}`]||"learning")===group);if(!items.length) return null;return <div className="journey-group" key={group}><h4><JourneyIcon status={group}/>{statusMeta[group].short}{statusMeta[group].note&&<i>{statusMeta[group].note}</i>}<span>{items.length}</span></h4><div>{items.map(n=>{const key=`${juz.n}-${n}`;return <button key={key} onClick={()=>openStatus({key,name:surahs[n-1].en,juz:juz.n})} title={`Change ${surahs[n-1].en}`}><JourneyIcon status={group}/><span><b>{surahs[n-1].en}</b></span></button>})}</div></div>})})()}</div>
        </div>}
      </div>;
      })}
    </div>
  </div>
}

function ArtCanvas({juzs,saved}:{juzs:Juz[];saved:Saved}) {
  const imageRef=useRef<HTMLImageElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const img=imageRef.current,canvas=canvasRef.current;
    if(!img||!canvas) return;
    const paint=()=>{
      const w=img.naturalWidth,h=img.naturalHeight;
      if(!w||!h) return;
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      if(!ctx) return;
      ctx.drawImage(img,0,0,w,h);
      juzs.forEach(juz=>juz.surahs.forEach((n,i)=>{
        const key=`${juz.n}-${n}`,fill=saved.colored[key];
        if(!fill) return;
        if(juz.n!==30&&targetedPaintRects[key]){
          const r=targetedPaintRects[key],x=Math.floor(r[0]/100*w),y=Math.floor(r[1]/100*h),rw=Math.ceil(r[2]/100*w),rh=Math.ceil(r[3]/100*h),pixels=ctx.getImageData(x,y,rw,rh),blend=fill==="sunset"?[[245,154,98],[231,92,134],[138,98,199]]:fill==="sunrise"?[[246,167,107],[245,207,104],[182,146,216]]:null,hex=blend?"":fill.replace("#",""),solid=blend?null:[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
          for(let p=0;p<pixels.data.length;p+=4){const red=pixels.data[p],green=pixels.data[p+1],blue=pixels.data[p+2],light=(red+green+blue)/3,sat=Math.max(red,green,blue)-Math.min(red,green,blue);if(light>112&&sat<132){const q=p/4,px=q%rw,py=Math.floor(q/rw),position=Math.min(1,Math.max(0,(px/rw+py/rh)/2)),segment=position<.5?0:1,t=position<.5?position*2:(position-.5)*2,from=blend?.[segment]||solid!,to=blend?.[segment+1]||solid!,tr=from[0]+(to[0]-from[0])*t,tg=from[1]+(to[1]-from[1])*t,tb=from[2]+(to[2]-from[2])*t,amount=Math.min(.76,Math.max(.28,(light-105)/150*.76));pixels.data[p]=red*(1-amount)+tr*amount;pixels.data[p+1]=green*(1-amount)+tg*amount;pixels.data[p+2]=blue*(1-amount)+tb*amount;}}
          ctx.putImageData(pixels,x,y);return;
        }
        const core=bookRects[juz.n][i],r=fullBookRect(juz.n,core),x=Math.floor(r[0]/100*w),y=Math.floor(r[1]/100*h),rw=Math.ceil(r[2]/100*w),rh=Math.ceil(r[3]/100*h),coreX=Math.max(0,Math.floor((core[0]-r[0])/100*w)),coreY=Math.max(0,Math.floor((core[1]-r[1])/100*h)),coreR=Math.min(rw,Math.ceil((core[0]+core[2]-r[0])/100*w)),coreB=Math.min(rh,Math.ceil((core[1]+core[3]-r[1])/100*h));
        const pixels=ctx.getImageData(x,y,rw,rh),blend=fill==="sunset"?[[245,154,98],[231,92,134],[138,98,199]]:fill==="sunrise"?[[246,167,107],[245,207,104],[182,146,216]]:null,hex=blend?"":fill.replace("#",""),solid=blend?null:[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)],count=rw*rh,candidate=new Uint8Array(count),seen=new Uint8Array(count),queue=new Int32Array(count);
        for(let q=0;q<count;q++){const p=q*4,red=pixels.data[p],green=pixels.data[p+1],blue=pixels.data[p+2],light=(red+green+blue)/3,sat=Math.max(red,green,blue)-Math.min(red,green,blue);if(light>112&&sat<132)candidate[q]=1;}
        for(let start=0;start<count;start++){if(!candidate[start]||seen[start])continue;let head=0,tail=0,touchesCore=false;queue[tail++]=start;seen[start]=1;while(head<tail){const q=queue[head++],px=q%rw,py=Math.floor(q/rw);if(px>=coreX&&px<coreR&&py>=coreY&&py<coreB)touchesCore=true;const neighbors=[q-1,q+1,q-rw,q+rw];for(const next of neighbors){if(next>=0&&next<count&&!seen[next]&&candidate[next]&&(next===q-1?px>0:next===q+1?px<rw-1:true)){seen[next]=1;queue[tail++]=next;}}}if(!touchesCore)continue;for(let z=0;z<tail;z++){const q=queue[z],p=q*4,red=pixels.data[p],green=pixels.data[p+1],blue=pixels.data[p+2],light=(red+green+blue)/3,px=q%rw,py=Math.floor(q/rw),position=Math.min(1,Math.max(0,(px/rw+py/rh)/2)),segment=position<.5?0:1,t=position<.5?position*2:(position-.5)*2,from=blend?.[segment]||solid!,to=blend?.[segment+1]||solid!,tr=from[0]+(to[0]-from[0])*t,tg=from[1]+(to[1]-from[1])*t,tb=from[2]+(to[2]-from[2])*t,amount=Math.min(.76,Math.max(.28,(light-105)/150*.76));pixels.data[p]=red*(1-amount)+tr*amount;pixels.data[p+1]=green*(1-amount)+tg*amount;pixels.data[p+2]=blue*(1-amount)+tb*amount;}}
        ctx.putImageData(pixels,x,y);
      }));
    };
    if(img.complete) paint(); else img.addEventListener("load",paint,{once:true});
    return()=>img.removeEventListener("load",paint);
  },[juzs,saved.colored]);
  const first=juzs[0],crop=cropForJuz(first.n),fullRatio=first.n===30?.5:2/3;
  return <div className="art-image-layer" style={{aspectRatio:String(fullRatio/(crop/100))}}><img ref={imageRef} src={artForJuz(first.n)} alt={`Original illustrated Quran tracker page containing Juz ${first.n} through ${juzs[juzs.length-1].n}`}/><canvas ref={canvasRef} aria-hidden="true"/></div>;
}
