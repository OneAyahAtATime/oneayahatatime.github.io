import { useEffect, useMemo, useRef, useState } from "react";

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

// Each Juz is traditionally named after its opening words. All 30 are listed so
// the labels are consistent — previously only 23-30 had one, which looked like
// a mistake on the home screen.
const rawJuz: [number, number[], string?][] = [
  [1,[1,2],"Alif Lam Mim"],[2,[2],"Sayaqul"],[3,[3],"Tilka ar-Rusul"],[4,[4],"Lan Tanalu"],
  [5,[4],"Wal-Muhsanat"],[6,[5],"La Yuhibbullah"],[7,[6],"Wa Idha Sami’u"],[8,[7],"Wa Law Annana"],
  [9,[8],"Qal al-Mala’"],[10,[9],"Wa A‘lamu"],[11,[10,11],"Ya‘tadhiruna"],[12,[12],"Wa Ma Min Dabbah"],
  [13,[13,14],"Wa Ma Ubarri’u"],[14,[15,16],"Rubama"],[15,[17,18],"Subhana alladhi"],[16,[19,20],"Qala Alam"],
  [17,[21,22],"Iqtaraba"],[18,[23,24,25],"Qad Aflaha"],[19,[26,27],"Wa Qala alladhina"],[20,[28,29],"A’man Khalaqa"],
  [21,[30,31,32,33],"Utlu Ma Uhiya"],[22,[34,35],"Wa Man Yaqnut"],[23,[36,37,38,39],"Wa Mali"],[24,[40,41],"Faman Azlam"],
  [25,[42,43,44,45],"Ilayhi Yuraddu"],[26,[46,47,48,49,50,51],"Ha-Mim"],[27,[52,53,54,55,56,57],"Qala Fama Khatbukum"],
  [28,[58,59,60,61,62,63,64,65,66],"Qad Sami’a"],[29,[67,68,69,70,71,72,73,74,75,76,77],"Tabarak"],
  [30,Array.from({length:37},(_,i)=>i+78),"‘Amma"],
];
const juzs: Juz[] = rawJuz.map(([n,surahs,label])=>({n,surahs,label}));
const pageGroups = [[1,6],[7,13],[14,18],[19,22],[23,25],[26,27],[28,29],[30,30]] as const;
const colorOptions = [
  {value:"#e05287",label:"Rose"},{value:"#f06f61",label:"Coral"},{value:"#ed8f3d",label:"Orange"},{value:"#f2c94c",label:"Golden yellow"},{value:"#65b96e",label:"Leaf green"},{value:"#2bb3a3",label:"Aqua"},{value:"#43b8d1",label:"Sky blue"},{value:"#4f8bd8",label:"Blue"},{value:"#7d5bd1",label:"Purple"},{value:"#b765c4",label:"Orchid"},
  {value:"sunset",label:"Sunset blend",background:"linear-gradient(135deg,#f59a62,#e75c86 52%,#8a62c7)"},{value:"sunrise",label:"Sunrise blend",background:"linear-gradient(135deg,#f6a76b,#f5cf68 52%,#b692d8)"},
];
const colors = colorOptions.map(option=>option.value);
const artForJuz = (n:number) => asset(n<=6?"juz-1-6.png":n<=13?"juz-7-13.png":n<=18?"juz-14-18.png":n<=22?"juz-19-22.png":n<=25?"juz-23-25.png":n<=27?"juz-26-27.png":n<=29?"juz-28-29.png":"juz-30-five-shelves-v9.png");
const cropForJuz = (n:number) => n<=6?82.8:n<=13?80:n<=18?82.5:n<=22?81.5:n<=25?80:n<=27?78:n<=29?84.5:87.5;
type Rect = [number,number,number,number];
const row = (count:number,y:number,x1:number,x2:number,h:number):Rect[] => Array.from({length:count},(_,i)=>{const gap=1.1,w=(x2-x1-gap*(count-1))/count;return [x1+i*(w+gap),y,w,h]});
const bookRects:Record<number,Rect[]> = {
  1:[[29,13,20,10],[52,13,20,10]],2:[[28,27,44,8]],3:[[31,39,39,9]],4:[[31,52,39,8]],5:[[29,64,43,8]],6:[[31,75,40,8]],
  7:[[41,9,18,10]],8:[[41,21,18,9]],9:[[41,32,18,9]],10:[[41,42,18,8]],11:[[32,51,17,9],[52,51,18,9]],12:[[41,61,18,9]],13:[[32,71,17,8],[52,71,18,8]],
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
  "5-4":[27.6,62.9,45.1,10],"11-10":[31,50.2,19.2,10.2],"13-13":[31,70.2,19.2,9.7],"13-14":[51.2,70.2,20.8,9.7],
  "16-19":[30.7,43.1,19.6,10.9],"16-20":[51.7,43.1,18.6,10.9],
  "17-21":[30.7,57.3,19.6,10.9],"17-22":[51.7,57.3,18.6,10.9],"21-31":[32.2,52.4,16.3,13.2],"21-32":[49.3,52.4,18.1,13.2],
  "22-34":[28.3,68.9,19.4,12.5],"22-35":[53.2,68.9,19.4,12.5],"23-36":[15,19.3,16.9,18],"25-43":[32.1,64.4,16.5,15.1],
  "26-51":[79.8,26.7,12.3,18.7],"27-54":[37.5,55.6,13,19.7],"27-55":[51.05,55.6,12.8,19.7],"27-56":[64.35,55.6,13,19.7],"27-57":[77.95,55.6,12.8,19.7],
  "29-67":[9.8,54.5,12.5,13.9],"29-68":[22.7,54.5,13.1,13.9],"29-69":[36.9,54.5,13,13.9],"29-70":[51.2,54.5,12.8,13.9],"29-71":[65.2,54.5,12.6,13.9],"29-73":[13.8,69.5,14.6,14.1],
};
const iconRects:Record<string,Rect> = {
  "1-1":[42.76,18.84,4.1,2.73],"1-2":[64.88,18.84,4.1,2.73],"2-2":[65.17,31.29,4.1,2.73],"3-3":[62.96,43.83,4.1,2.73],
  "4-4":[62.47,56.29,4.1,2.73],"5-4":[61.66,68.26,4.1,2.73],"6-5":[58.71,79.26,4.1,2.73],"7-6":[53.75,15.14,3.22,2.15],
  "8-7":[53.45,26.54,3.22,2.15],"9-8":[52.09,37.54,3.22,2.15],"10-9":[52.68,46.88,3.22,2.15],"11-10":[44.41,56.54,3.22,2.15],
  "11-11":[64.42,56.54,3.22,2.15],"12-12":[53.26,66.5,3.22,2.15],"13-13":[44.41,75.88,3.22,2.15],"13-14":[65.6,76.07,3.22,2.15],
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
 * A Juz counts as finished only when every surah in it is "It's in my heart".
 * It used to count as finished as soon as every book had been colored, which
 * meant a single-surah Juz threw its completion celebration on the very first
 * tap, before anything had actually been memorized.
 */
const juzMemorized = (juz:Juz,statuses:Record<string,RevisionStatus>) =>
  juz.surahs.every(n=>statuses[`${juz.n}-${n}`]==="memorized");

function BlankBookIcon() {
  return <span className="blank-book" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><rect x="15" y="8" width="34" height="48" rx="7" stroke="#bda2d8" strokeWidth="3" strokeDasharray="5 5"/><circle cx="32" cy="41" r="8.5" stroke="#cdb6de" strokeWidth="2.5"/><path d="M25 21h14" stroke="#d8c6e5" strokeWidth="3" strokeLinecap="round"/><path d="M27 28h10" stroke="#e0d2ea" strokeWidth="3" strokeLinecap="round"/></svg></span>;
}

function JourneyIcon({status,className="",style}:{status:RevisionStatus;className?:string;style?:React.CSSProperties}) {
  const src=asset(status==="learning"?"status-art/learning-moon.png":status==="memorized"?"status-art/memorized-star.png":"status-art/practice-beads.png");
  return <span className={`journey-icon journey-${status} ${className}`} style={style} aria-hidden="true"><img src={src} alt=""/></span>;
}
type Saved = { name: string; colored: Record<string,string>; dates: Record<string,string>; favorites: Record<string,string>; workingOn:Record<string,CurrentWork>; statuses:Record<string,RevisionStatus>; practiceDays:string[] };
const empty: Saved = { name:"", colored:{}, dates:{}, favorites:{}, workingOn:{}, statuses:{}, practiceDays:[] };
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};

/**
 * A reciter's name is only ever a label. Progress is stored against a stable
 * id, so renaming a reciter — or adding and removing others — never disturbs
 * anyone else's books.
 *
 * No name ships with the app and none is required: the default is neutral,
 * families are asked for a nickname rather than a full name, and whatever they
 * type stays in their own browser. Nothing is sent anywhere.
 */
type Reciter = { id:string; name:string };
const RECITERS_KEY="quran-tracker-reciters";
const defaultReciterName=(position:number)=>`Reciter ${position}`;
const progressKey=(id:string)=>`quran-tracker-progress-${id}`;
const MAX_NAME=24;

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
    workingOn:partial.workingOn??{},
    statuses:partial.statuses??{},
    practiceDays:partial.practiceDays??[],
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
  const [celebrating,setCelebrating] = useState<number|null>(null);
  const [certificate,setCertificate] = useState<number|null>(null);
  const [nextUp,setNextUp] = useState<{juz:number;name:string}|null>(null);

  // Progress is kept in this browser's own storage. There is no server: the
  // site is a set of static files, so nothing is sent anywhere. Syncing a
  // reciter's progress between devices comes later, via a family code.
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
  ];
  const currentRange=pageGroups[activeGroup??0];
  const currentJuzs=juzs.filter(j=>j.n>=currentRange[0]&&j.n<=currentRange[1]);
  const rangeLabel=currentRange[0]===currentRange[1]?`Juz ${currentRange[0]}`:`Juz ${currentRange[0]}–${currentRange[1]}`;

  const openJuz=(n:number)=>{
    const group=pageGroups.findIndex(([from,to])=>n>=from&&n<=to);
    setActiveGroup(group<0?0:group);
    setOpenRow(n);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const goHome=()=>{ setActiveGroup(null); setOpenRow(null); window.scrollTo({top:0,behavior:"smooth"}); };

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
      practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()])),
    };
  });
  const chooseStatus=(status:RevisionStatus)=>{
    if(!statusBook)return;
    const {key,juz,name}=statusBook;
    const wasCurrent=status==="memorized"&&saved.workingOn[juz]?.surah===name;

    // Worked out here, from current state, rather than inside the updater —
    // the updater runs during a later render, so anything it sets would still
    // be false by the time the lines below run.
    const whole=juzs.find(j=>j.n===juz);
    const nextStatuses={...saved.statuses,[key]:status};
    // A Juz is finished when its last surah reaches "It's in my heart".
    const justFinishedJuz=!!whole&&juzMemorized(whole,nextStatuses)&&!saved.dates[juz];

    setSaved(s=>{
      const next:Saved={...s,statuses:{...s.statuses,[key]:status},practiceDays:Array.from(new Set([...(s.practiceDays||[]),localDay()]))};
      if(wasCurrent){const workingOn={...s.workingOn};delete workingOn[juz];next.workingOn=workingOn}
      if(justFinishedJuz) next.dates={...s.dates,[juz]:localDay()};
      return next;
    });
    setStatusBook(null);
    if(justFinishedJuz) setTimeout(()=>setCelebrating(juz),160);
    else if(wasCurrent) setTimeout(()=>setNextUp({juz,name}),140);
  };
  const unmarkBook=()=>{if(!statusBook)return;setSaved(s=>{const colored={...s.colored},statuses={...s.statuses},dates={...s.dates};delete colored[statusBook.key];delete statuses[statusBook.key];delete dates[statusBook.juz];return {...s,colored,statuses,dates}});setStatusBook(null)};
  const update = (field:"name"|"dates"|"favorites", key:string, value:string) => setSaved(s=> field==="name" ? {...s,name:value} : {...s,[field]:{...s[field],[key]:value}});
  const updateWork = (juz:number,field:keyof CurrentWork,value:string) => setSaved(s=>({...s,workingOn:{...s.workingOn,[juz]:{surah:s.workingOn[juz]?.surah||"",ayahs:s.workingOn[juz]?.ayahs||"",[field]:value}}}));
  const clearWork = (juz:number) => setSaved(s=>{const workingOn={...s.workingOn};delete workingOn[juz];return {...s,workingOn}});

  return <main>
    <section className="experience">
      <header className="app-titlebar">
        <div className="app-brand"><span className="brand-moon">☾</span><div><p>ONE AYAH AT A TIME</p><h1>My Quran <span>Memorization Tracker</span></h1></div></div>
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
                {reciters.length>1&&(confirmRemove
                  ? <p className="remove-confirm">Remove {reciter} and their books? <button type="button" className="danger" onClick={removeReciter}>Yes, remove</button> <button type="button" onClick={()=>setConfirmRemove(false)}>Keep</button></p>
                  : <button type="button" className="remove-reciter" onClick={()=>setConfirmRemove(true)}>Remove this reciter</button>)}
              </form>
            : <button type="button" className="rename-learner" onClick={()=>setRenaming(true)}>Rename {reciter}</button>}
          <small><i className={syncStatus.includes("won’t let")?"error":""}/> {syncStatus}</small>
        </div>
      </header>

      {/*
        The bar counts books, where every surah counts once. That is not the
        same as how much of the Quran is memorized — Juz 30 alone is 37 of the
        116 books — so it is labelled as books rather than as a bare percentage,
        with the Juz count beside it.
      */}
      <div className="journey-strip" aria-label="Overall memorization progress">
        <div className="progress-copy"><div><span className="tiny">{reciter.toUpperCase()}’S JOURNEY</span><strong>{completedBooks} of {totalBooks} books colored</strong></div><span>{completeJuz} of 30 Juz memorized</span></div>
        <div className="progress" title={`Any book you have started counts here, whatever its status. Every surah counts once, so short surahs move this as much as long ones.`} aria-label={`${completedBooks} of ${totalBooks} books colored. Every book you have started counts.`}><i style={{width:`${pct}%`}}/></div>
        <div className="gentle-streak">☾ You practiced <strong>{practicedThisWeek} {practicedThisWeek===1?"day":"days"}</strong> this week</div>
      </div>

      <section className="achievement-card" aria-label={`${reciter}'s achievements`}><div><span className="tiny">A GROWING COLLECTION</span><h2>{reciter}’s achievements</h2></div><div className="badges">{badges.map(b=><div key={b.name} className={`badge ${b.earned?"earned":"locked"}`} title={b.earned?`${b.name} earned!`:b.note}><span>{b.icon}</span><b>{b.name}</b><small>{b.note}</small></div>)}</div></section>

      {onHome ? <>
        <MemorizingNow saved={saved} openJuz={openJuz} clearWork={clearWork}/>
        <section className="juz-overview" aria-label="All 30 Juz">
          <div className="tracker-top"><h2>Choose a Juz</h2></div>
          <div className="juz-tiles">
            {juzs.map(juz=>{
              const total=juz.surahs.length;
              const done=juz.surahs.filter(n=>saved.colored[`${juz.n}-${n}`]).length;
              const memorized=juzMemorized(juz,saved.statuses||{});
              const learning=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="learning").length;
              return <button key={juz.n} className={`juz-tile ${memorized?"complete":done?"started":""}`} onClick={()=>openJuz(juz.n)}
                aria-label={`Juz ${juz.n}${juz.label?`, ${juz.label}`:""} — ${done} of ${total} books colored${memorized?", all memorized":""}`}>
                <span className="tile-top"><small>JUZ</small><strong>{juz.n}</strong></span>
                {juz.label&&<em className="tile-label">{juz.label}</em>}
                <span className="tile-meter" aria-hidden="true"><i style={{width:`${done/total*100}%`}}/></span>
                <span className="tile-count">{memorized?"✓ Memorized":`${done} of ${total} books`}</span>
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
          <div><p className="eyebrow">TAP THE BOOKS IN THE ARTWORK</p><h2>{rangeLabel}</h2></div>
          <div className="tools"><span>Book color</span>{colorOptions.map(option=><button key={option.value} aria-label={`Choose ${option.label}`} title={option.label} aria-pressed={color===option.value} className={`swatch ${option.background?"blend-swatch":""}`} onClick={()=>setColor(option.value)} style={{background:option.background||option.value}}/>)}</div>
        </div>
        <IllustratedTracker juzs={currentJuzs} saved={saved} toggle={toggle} update={update} updateWork={updateWork} clearWork={clearWork} openStatus={setStatusBook} openCertificate={setCertificate} openRow={openRow} setOpenRow={setOpenRow}/>
      </>}
    </section>

    {statusBook&&<div className="modal-backdrop" onMouseDown={()=>setStatusBook(null)}><section className="status-dialog" role="dialog" aria-modal="true" aria-label={`Revision status for ${statusBook.name}`} onMouseDown={e=>e.stopPropagation()}><button className="close-x" onClick={()=>setStatusBook(null)}>×</button><img className="status-masjid" src={asset("status-art/status-masjid.png")} alt="Watercolor masjid"/><p className="eyebrow">HOW IS THIS SURAH GOING?</p><h2>{statusBook.name}</h2><p>Choose a gentle reminder for your journey.</p><div className="status-choices">{journeyOrder.map(status=><button key={status} className={saved.statuses[statusBook.key]===status?"selected":undefined} aria-pressed={saved.statuses[statusBook.key]===status} onClick={()=>chooseStatus(status)}><JourneyIcon status={status}/><b>{statusMeta[status].label}</b>{statusMeta[status].hint&&<small className="status-hint">{statusMeta[status].hint}</small>}</button>)}<button className="status-reset" onClick={unmarkBook}><BlankBookIcon/><b>I haven’t started this yet</b><small className="status-hint">Puts this book back to blank so it can be colored in again whenever you like.</small></button></div></section></div>}

    {nextUp&&(()=>{const juz=juzs.find(j=>j.n===nextUp.juz)!;const remaining=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]!=="memorized");return <div className="modal-backdrop" onMouseDown={()=>setNextUp(null)}><section className="status-dialog next-up" role="dialog" aria-modal="true" aria-label="Choose what to memorize next" onMouseDown={e=>e.stopPropagation()}><button className="close-x" onClick={()=>setNextUp(null)}>×</button><JourneyIcon status="memorized" className="next-up-star"/><p className="eyebrow">MASHAALLAH!</p><h2>{nextUp.name} is in your heart</h2><p>{remaining.length?`What would you like to work on next in Juz ${juz.n}?`:`That was the last surah in Juz ${juz.n}. Beautiful work.`}</p>{remaining.length>0&&<div className="next-choices">{remaining.map(n=><button key={n} onClick={()=>{updateWork(juz.n,"surah",surahs[n-1].en);setNextUp(null)}}><JourneyIcon status="learning"/><span>{surahs[n-1].en}</span></button>)}</div>}<button className="unmark" onClick={()=>setNextUp(null)}>Not right now</button></section></div>})()}

    {celebrating&&<div className="celebration" role="dialog" aria-modal="true"><div className="confetti" aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}>{i%3===0?"★":i%3===1?"✦":"●"}</i>)}</div><div className="celebrate-card"><img className="glow-lantern" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon and lantern"/><p className="eyebrow">A BEAUTIFUL MILESTONE</p><h2>MashaAllah, {reciter}!</h2><p>You completed Juz {celebrating}. May every ayah stay bright in your heart.</p><div><button onClick={()=>{setCertificate(celebrating);setCelebrating(null)}}>See my certificate</button><button className="quiet" onClick={()=>setCelebrating(null)}>Keep exploring</button></div></div></div>}

    {certificate&&<div className="certificate-screen" role="dialog" aria-modal="true"><div className="certificate"><button className="close-x no-print" onClick={()=>setCertificate(null)}>×</button><div className="cert-stars">✦ · ★ · ✦ · ★ · ✦</div><img className="cert-top-moon" src={asset("status-art/learning-moon.png")} alt="Watercolor crescent moon"/><p>CERTIFICATE OF QURAN MEMORIZATION</p><h2>MashaAllah!</h2><span>This certificate celebrates</span><h1>{reciter}</h1><span>for completing</span><h3>Juz {certificate}</h3><p className="cert-date">Completed {new Date(`${saved.dates[certificate]}T12:00:00`).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}</p><div className="cert-dua">May Allah fill your heart with the light of the Quran.</div><div className="cert-art"><img src={asset("status-art/learning-moon.png")} alt=""/><img src={asset("status-art/memorized-star.png")} alt=""/><img className="cert-masjid" src={asset("status-art/status-masjid.png")} alt=""/><img src={asset("status-art/memorized-star.png")} alt=""/><img src={asset("status-art/learning-moon.png")} alt=""/></div><button className="print-button no-print" onClick={()=>window.print()}>Print or save certificate</button></div></div>}

    <footer><span>☾</span><p>May every page bring your heart closer to the Quran.</p><span>♥</span></footer>
  </main>
}

/**
 * Everything being memorized right now, gathered from every Juz into one place
 * on the home screen. Without this a family has to open all eight artwork pages
 * to remember what they were working on.
 */
function MemorizingNow({saved,openJuz,clearWork}:{saved:Saved;openJuz:(n:number)=>void;clearWork:(juz:number)=>void}) {
  // Every book marked "I'm learning this" belongs here, not only the ones
  // chosen in the Currently memorizing dropdown. Coloring a book is the
  // normal way to start one, so it has to be what fills this list.
  const items:{key:string;juz:number;name:string;ayahs:string;fromDropdown:boolean}[]=[];
  for(const juz of juzs) {
    const work=saved.workingOn[juz.n];
    const learning=juz.surahs.filter(n=>saved.statuses[`${juz.n}-${n}`]==="learning");
    for(const n of learning) {
      const name=surahs[n-1].en;
      items.push({key:`${juz.n}-${n}`,juz:juz.n,name,ayahs:work?.surah===name?(work.ayahs||""):"",fromDropdown:false});
    }
    // A surah chosen in the dropdown but not yet colored still belongs here.
    if(work?.surah&&!learning.some(n=>surahs[n-1].en===work.surah))
      items.push({key:`w${juz.n}`,juz:juz.n,name:work.surah,ayahs:work.ayahs||"",fromDropdown:true});
    else if(work&&!work.surah&&work.ayahs)
      items.push({key:`w${juz.n}`,juz:juz.n,name:"A surah in this Juz",ayahs:work.ayahs,fromDropdown:true});
  }

  return <section className="memorizing-now" aria-label="Currently memorizing">
    <div className="tracker-top"><h2>Currently memorizing</h2></div>
    {items.length===0
      ? <p className="memorizing-empty"><JourneyIcon status="learning"/><span>Nothing yet. Color a book in any Juz and it will appear here while you learn it.</span></p>
      : <div className="memorizing-list">{items.map(item=>
          <div className="memorizing-item" key={item.key}>
            <JourneyIcon status="learning"/>
            <button className="memorizing-open" onClick={()=>openJuz(item.juz)}>
              <b>{item.name}</b>
              <small>Juz {item.juz}{item.ayahs?` · ayahs ${item.ayahs}`:""}</small>
            </button>
            {item.fromDropdown&&<button className="clear-work" title={`Clear what is being memorized in Juz ${item.juz}`} aria-label={`Clear what is being memorized in Juz ${item.juz}`} onClick={()=>clearWork(item.juz)}>×</button>}
          </div>)}
        </div>}
  </section>;
}

function IllustratedTracker({juzs,saved,toggle,update,updateWork,clearWork,openStatus,openCertificate,openRow,setOpenRow}:{juzs:Juz[];saved:Saved;toggle:(k:string)=>void;update:(f:"dates"|"favorites",k:string,v:string)=>void;updateWork:(juz:number,field:keyof CurrentWork,value:string)=>void;clearWork:(juz:number)=>void;openStatus:(book:{key:string;name:string;juz:number})=>void;openCertificate:(juz:number)=>void;openRow:number|null;setOpenRow:(n:number|null)=>void}) {
  const first=juzs[0],crop=cropForJuz(first.n),groupLabel=juzs.length===1?`Juz ${first.n}`:`Juz ${first.n}–${juzs[juzs.length-1].n}`;
  return <div className="integrated-tracker">
    <div className={`interactive-art ${first.n===30?"wide-art":""}`}>
      <ArtCanvas juzs={juzs} saved={saved}/>
      {juzs.flatMap(juz=>juz.surahs.map((n,i)=>{const s=surahs[n-1],key=`${juz.n}-${n}`,fill=saved.colored[key],status=saved.statuses[key]||(fill?"learning":undefined),r=juz.n!==30&&isolatedInteractionKeys.has(key)?targetedPaintRects[key]:fullBookRect(juz.n,bookRects[juz.n][i]),ir=iconRects[key];return <button key={key} className={`art-book ${fill?"filled":""} status-${status||"none"}`} style={{left:`${r[0]}%`,top:`${r[1]/crop*100}%`,width:`${r[2]}%`,height:`${r[3]/crop*100}%`,"--fill":fill||"#e05287"} as React.CSSProperties} onClick={()=>fill?openStatus({key,name:s.en,juz:juz.n}):toggle(key)} aria-pressed={!!fill} aria-label={`${fill?`Set revision status for ${s.en}`:`Mark ${s.en}`} in Juz ${juz.n}`} title={fill?`${s.en} — ${statusMeta[status!].label}`:`${s.en} — tap to color`}>{fill&&<JourneyIcon status={status!} style={ir?{left:`${(ir[0]-r[0])/r[2]*100}%`,top:`${(ir[1]-r[1])/r[3]*100}%`,width:`${ir[2]/r[2]*100}%`,height:`${ir[3]/r[3]*100}%`}:undefined}/>}</button>}))}
    </div>
    <div className="art-actions"><p className="tap-hint"><span>✦</span> Tap the books directly in the artwork to select them <span>✦</span></p></div>
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
          `${colored} of ${juz.surahs.length} books colored`,
          learning.length?`learning ${learning.slice(0,2).join(", ")}${learning.length>2?` +${learning.length-2}`:""}`:null,
          revising?`${revising} in muraja’ah`:null,
          inHeart?`${inHeart} in my heart`:null,
        ].filter(Boolean).join(" · ");
        return <div className={`juz-note-row ${expanded?"expanded":"collapsed"}`} key={juz.n}>
        <button type="button" className="row-toggle" aria-expanded={expanded} onClick={()=>setOpenRow(expanded?null:juz.n)}>
          <b>Juz {juz.n}</b><span className="row-summary">{summary}</span><span className="row-chevron" aria-hidden="true">{expanded?"▾":"▸"}</span>
        </button>
        {expanded&&<div className="row-body"><div className="auto-date"><JourneyIcon status="memorized"/><div>Date memorized<strong>{saved.dates[juz.n]?new Date(`${saved.dates[juz.n]}T12:00:00`).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}):"Added automatically once every book is in your heart"}</strong>{saved.dates[juz.n]&&<button className="certificate-link" onClick={()=>openCertificate(juz.n)}>View certificate</button>}</div></div><label><span>♥</span><div>Favorite Surah<input value={saved.favorites[juz.n]||""} onChange={e=>update("favorites",String(juz.n),e.target.value)} placeholder="Write a favorite…"/></div></label><div className="current-work"><JourneyIcon status="learning"/><div><strong>Currently memorizing</strong><div className="work-fields"><select aria-label={`Surah currently being memorized in Juz ${juz.n}`} value={saved.workingOn[juz.n]?.surah||""} onChange={e=>updateWork(juz.n,"surah",e.target.value)}><option value="">Not working on one right now</option>{juz.surahs.map(n=><option key={n} value={surahs[n-1].en}>{surahs[n-1].en}</option>)}</select><input aria-label={`Ayahs currently being memorized in Juz ${juz.n}`} value={saved.workingOn[juz.n]?.ayahs||""} onChange={e=>updateWork(juz.n,"ayahs",e.target.value)} placeholder="Ayahs, e.g. 1–5"/>{(saved.workingOn[juz.n]?.surah||saved.workingOn[juz.n]?.ayahs)&&<button type="button" className="clear-work" onClick={()=>clearWork(juz.n)} aria-label={`Clear what is being memorized in Juz ${juz.n}`} title="Clear this">×</button>}</div></div></div><div className="book-journey"><strong>Book journey</strong>{(()=>{const done=juz.surahs.filter(n=>saved.colored[`${juz.n}-${n}`]);if(!done.length) return <div className="journey-empty"><em>Select a book to begin its journey.</em></div>;return journeyOrder.map(group=>{const items=done.filter(n=>(saved.statuses[`${juz.n}-${n}`]||"learning")===group);if(!items.length) return null;return <div className="journey-group" key={group}><h4><JourneyIcon status={group}/>{statusMeta[group].short}{statusMeta[group].note&&<i>{statusMeta[group].note}</i>}<span>{items.length}</span></h4><div>{items.map(n=>{const key=`${juz.n}-${n}`;return <button key={key} onClick={()=>openStatus({key,name:surahs[n-1].en,juz:juz.n})} title={`Change ${surahs[n-1].en}`}><JourneyIcon status={group}/><span><b>{surahs[n-1].en}</b></span></button>})}</div></div>})})()}</div></div>}</div>;
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
