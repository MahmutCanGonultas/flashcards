import type { TopicBody } from "./types";

/** Elementary: word types, the present simple, questions, sentence order, to / by / from, numbers, ordinals and frequency. */
export const ELEMENTARY: Record<string, TopicBody> = {
  "noun-adjective-verb": {
    intro: "Bir cümleyi çözmenin ilk adımı parçalarını tanımak: kim ya da ne (isim), nasıl (sıfat), ne yapıyor (fiil). Bu üçünü ayırabilen, sözlükte doğru kelimeyi bulur.",
    legend: { partner: "isim (noun)", focus: "fiil (verb)", extra: "sıfat (adjective)" },
    sections: [
      {
        title: "Üç temel parça",
        table: {
          head: ["Tür", "Sorusu", "Örnekler"],
          rows: [
            ["[isim — noun]", "kim? ne?", "[teacher] · [city] · [coffee] · [idea]"],
            ["{fiil — verb}", "ne yapıyor?", "{work} · {drink} · {think} · {go}"],
            ["<sıfat — adjective>", "nasıl? ne gibi?", "<tired> · <big> · <cheap> · <beautiful>"],
          ],
        },
        note: "Sözlükte kelimenin yanında yazar: n (noun), v (verb), adj (adjective).",
      },
      {
        title: "Cümlede yerleri",
        body: "İngilizcede sıra sabittir: [isim] + {fiil} + [isim]. Sıfat, Türkçedeki gibi ismin önüne gelir: a <cheap> [flat]. Ya da to be'den sonra durur: The [flat] is <cheap>.",
        examples: [
          { en: "[My brother] {drinks} <strong> [coffee].", tr: "Ağabeyim sert kahve içer." },
          { en: "[Ayşe] {has} a <beautiful> [voice].", tr: "Ayşe'nin güzel bir sesi var." },
          { en: "The [film] was <long> but <funny>.", tr: "Film uzundu ama komikti." },
          { en: "[We] {live} in a <small> [town].", tr: "Küçük bir kasabada yaşıyoruz." },
        ],
        note: "Sıfat çoğul olmaz: <big> [houses], asla 'bigs houses'.",
      },
      {
        title: "Aynı aile, farklı tür",
        body: "Bir kelime ailesinde isim, fiil ve sıfat çoğu zaman ekle ayrılır. Sonlar ipucu verir: -tion, -ment, -ness genelde [isim]; -ful, -ous, -able, -ive genelde <sıfat>.",
        table: {
          head: ["Fiil", "İsim", "Sıfat"],
          rows: [
            ["{decide}", "[decision]", "<decisive>"],
            ["{enjoy}", "[enjoyment]", "<enjoyable>"],
            ["{create}", "[creation]", "<creative>"],
            ["{succeed}", "[success]", "<successful>"],
            ["{use}", "[use]", "<useful>"],
            ["{care}", "[care]", "<careful>"],
          ],
        },
      },
      {
        title: "Bir kelime, iki görev",
        body: "Bazı kelimeler hiç değişmeden hem isim hem fiil olur. Hangisi olduğunu cümledeki yeri söyler.",
        examples: [
          { en: "Thanks for your [help]. — Can you {help} me?", tr: "Yardımın için sağ ol. — Bana yardım eder misin?" },
          { en: "Let's go for a [walk]. — We {walk} to work.", tr: "Hadi yürüyüşe çıkalım. — İşe yürüyerek gideriz." },
          { en: "I need a [drink]. — I {drink} tea every morning.", tr: "Bir şey içmem lazım. — Her sabah çay içerim." },
        ],
      },
    ],
    mistakes: [
      { wrong: "She is a ~~woman beautiful~~.", right: "She is a <beautiful> [woman].", why: "Sıfat ismin önüne gelir." },
      { wrong: "They are ~~bigs~~ houses.", right: "They are <big> [houses].", why: "Sıfatlar çoğul eki almaz." },
      { wrong: "I ~~am agree~~.", right: "I {agree}.", why: "agree bir fiil; önüne am gelmez." },
      { wrong: "The film was very ~~enjoy~~.", right: "The film was very <enjoyable>.", why: "was'tan sonra sıfat gerekir." },
    ],
    tip: "Kelimenin sonuna bak: -tion / -ment / -ness → [isim], -ful / -ous / -able → <sıfat>. Bir kelimeyi öğrenirken ailesini de sor: decide, [decision], <decisive>.",
    quiz: [
      { kind: "choice", prompt: "Hangisi bir fiil (verb)?", options: ["decision", "decide", "decisive"], answer: 1, explain: "**decide** (karar vermek) bir eylem; decision isim, decisive sıfat." },
      { kind: "choice", prompt: "Hangisi bir sıfat (adjective)?", options: ["quickly", "beauty", "beautiful"], answer: 2, explain: "**beautiful** (güzel) bir ismi niteler." },
      { kind: "choice", prompt: "She has a ___ car.", tr: "Yeni bir arabası var.", options: ["new", "newly", "news"], answer: 0, explain: "İsmin önünde sıfat: a **new** car." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["I have a dog black.", "I have a black dog.", "I have black a dog."], answer: 1, explain: "Sıfat ismin önünde: a **black** dog." },
      { kind: "type", prompt: "Thank you for your ___.", tr: "Yardımın için teşekkürler. (help)", answer: ["help"], explain: "Burada **help** bir isim." },
      { kind: "choice", prompt: "The lesson was really ___.", tr: "Ders gerçekten faydalıydı.", options: ["use", "useful", "usefully"], answer: 1, explain: "was'tan sonra sıfat: **useful**." },
      { kind: "type", prompt: "I made a ___.", tr: "Bir karar verdim. (decide)", answer: ["decision"], explain: "decide fiilinin ismi: **decision**." },
      { kind: "order", tr: "Küçük bir evde yaşıyoruz.", answer: "We live in a small house.", extra: ["smalls", "houses"], explain: "Sıfat ismin önünde ve çoğul olmaz." },
      { kind: "order", tr: "Bu kahve çok sert.", answer: "This coffee is very strong.", extra: ["strongly", "are"], explain: "is'ten sonra sıfat: **strong**." },
      { kind: "type", prompt: "The film was really ___.", tr: "Film gerçekten keyifliydi. (enjoy)", answer: ["enjoyable"], explain: "was'tan sonra sıfat: enjoy → **enjoyable**." },
    ],
  },

  "simple-present": {
    intro: "Geniş zaman, alışkanlıkların zamanı: her sabah kahve içerim, İzmir'de yaşarım, hafta sonu çalışmam. Tek tuzağı var: he, she, it'e gelen -s.",
    legend: { partner: "özne", focus: "fiil · do · does", extra: "sıklık / zaman" },
    sections: [
      {
        title: "Ne zaman kullanılır?",
        body: "Her zaman olan, tekrar eden ya da genel olarak doğru olan şeyler için: alışkanlıklar, rutinler, gerçekler, tarifeler.",
        examples: [
          { en: "[I] {drink} coffee <every morning>.", tr: "Her sabah kahve içerim." },
          { en: "[My sister] {works} in a bank.", tr: "Kız kardeşim bir bankada çalışır." },
          { en: "[Water] {boils} at 100 degrees.", tr: "Su 100 derecede kaynar." },
          { en: "[The train] {leaves} <at 8:15>.", tr: "Tren 8.15'te kalkar." },
        ],
      },
      {
        title: "he / she / it: -s",
        body: "Olumlu cümlede he, she, it (ya da tek bir kişi, tek bir şey) için fiile {-s} eklenir: I work → she work{s}. Türkçede 'o çalışır' derken ek değişmez; İngilizcede değişen tek yer burası.",
        table: {
          head: ["Özne", "Fiil", "Örnek"],
          rows: [
            ["[I / you / we / they]", "{work}", "[They] {work} late."],
            ["[he / she / it]", "{works}", "[She] {works} late."],
          ],
        },
      },
      {
        title: "-s mi, -es mi, -ies mi?",
        table: {
          head: ["Fiil nasıl bitiyor?", "Ek", "Örnek"],
          rows: [
            ["çoğu fiil", "{-s}", "play → play{s} · read → read{s}"],
            ["-s, -sh, -ch, -x, -o", "{-es}", "watch → watch{es} · go → go{es} · do → do{es}"],
            ["sessiz harf + y", "{-ies}", "study → stud{ies} · cry → cr{ies}"],
            ["have", "düzensiz", "have → {has}"],
          ],
        },
      },
      {
        title: "Olumsuz ve soru: do / does",
        body: "Olumsuz ve soruda yardımcı fiil gelir: {do} / {does}. -s artık does'a geçer, asıl fiil yalın kalır: She works → She {doesn't} work. / {Does} she work?",
        table: {
          head: ["", "I / you / we / they", "he / she / it"],
          rows: [
            ["Olumsuz", "I {don't} eat meat.", "He {doesn't} eat meat."],
            ["Soru", "{Do} you eat meat?", "{Does} he eat meat?"],
            ["Kısa cevap", "Yes, I {do}. / No, I {don't}.", "Yes, he {does}. / No, he {doesn't}."],
          ],
        },
        examples: [
          { en: "[We] {don't} watch TV <in the evening>.", tr: "Akşamları televizyon izlemeyiz." },
          { en: "{Does} [your dad] cook?", tr: "Baban yemek yapar mı?" },
          { en: "Where {do} [you] live?", tr: "Nerede yaşıyorsun?" },
        ],
        note: "does'tan sonra fiil -s almaz: ~~Does she works?~~ → {Does} she work?",
      },
      {
        title: "Birlikte gelen zaman sözleri",
        body: "Geniş zaman cümlelerinde bu sözler sık görülür: <every day>, <on Mondays>, <at the weekend>, <in the morning>, <always>, <usually>, <sometimes>, <never>.",
        examples: [
          { en: "[I] {play} football <on Sundays>.", tr: "Pazar günleri futbol oynarım." },
          { en: "[She] <never> {eats} breakfast.", tr: "Hiç kahvaltı yapmaz." },
          { en: "[They] <usually> {go} to bed at eleven.", tr: "Genellikle on birde yatarlar." },
        ],
      },
    ],
    mistakes: [
      { wrong: "She ~~work~~ in a hospital.", right: "[She] {works} in a hospital.", why: "he / she / it için fiile -s." },
      { wrong: "~~Does she works~~ here?", right: "{Does} [she] work here?", why: "-s does'a geçti; fiil yalın kalır." },
      { wrong: "He ~~don't~~ like tea.", right: "[He] {doesn't} like tea.", why: "he / she / it → doesn't." },
      { wrong: "I ~~am work~~ every day.", right: "[I] {work} every day.", why: "Geniş zamanda am / is / are kullanılmaz." },
    ],
    tip: "Tekerleme gibi söyle: 'He, she, it — -s'yi al, git.' Olumsuzda ve soruda -s does'a taşınır; fiil çıplak kalır: {Does} she work?",
    quiz: [
      { kind: "choice", prompt: "[My brother] ___ in Berlin.", tr: "Ağabeyim Berlin'de yaşıyor.", options: ["live", "lives", "living"], answer: 1, explain: "My brother = he → **lives**." },
      { kind: "choice", prompt: "[They] ___ coffee.", tr: "Kahve içmezler.", options: ["doesn't drink", "don't drink", "don't drinks"], answer: 1, explain: "They → **don't** + yalın fiil." },
      { kind: "type", prompt: "___ [your parents] live in İzmir?", tr: "Annenle baban İzmir'de mi yaşıyor?", answer: ["Do"], explain: "your parents = they → **Do**." },
      { kind: "type", prompt: "[He] ___ TV every evening.", tr: "Her akşam televizyon izler. (watch)", answer: ["watches"], explain: "-ch ile biten fiil: watch → **watches**." },
      { kind: "type", prompt: "[My daughter] ___ hard for her exams.", tr: "Kızım sınavları için çok çalışır. (study)", answer: ["studies"], explain: "Sessiz + y: study → **studies**." },
      { kind: "type", prompt: "[Ali] ___ like cold weather.", tr: "Ali soğuk havayı sevmez.", answer: ["doesn't", "does not"], explain: "He → **doesn't** like." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["She watches TV.", "He don't eat fish.", "They play tennis."], answer: 1, explain: "he → **doesn't**: He doesn't eat fish." },
      { kind: "order", tr: "Babam hafta sonları çalışmaz.", answer: "My father doesn't work at weekends.", extra: ["works", "don't"], explain: "doesn't + yalın fiil: **doesn't work**." },
      { kind: "order", tr: "Kardeşim et yemez.", answer: "My brother doesn't eat meat.", extra: ["eats", "don't"], explain: "doesn't'tan sonra yalın fiil: **eat**." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["Where does she works?", "Where does she work?", "Where she works?"], answer: 1, explain: "Wh + **does** + özne + yalın fiil." },
    ],
  },

  "wh-questions": {
    intro: "Evet / hayır soruları sohbeti açar; wh- soruları sürdürür. What, where, when, who, why, how: ne, nerede, ne zaman, kim, neden, nasıl.",
    legend: { focus: "soru kelimesi", partner: "yardımcı fiil", extra: "özne" },
    sections: [
      {
        title: "Soru kelimeleri",
        table: {
          head: ["Kelime", "Türkçe", "Örnek"],
          rows: [
            ["{What}", "ne?", "{What} [is] <your name>?"],
            ["{Where}", "nerede? nereye?", "{Where} [do] <you> work?"],
            ["{When}", "ne zaman?", "{When} [does] <the shop> open?"],
            ["{Who}", "kim?", "{Who} [is] <that man>?"],
            ["{Why}", "neden?", "{Why} [are] <you> sad?"],
            ["{How}", "nasıl?", "{How} [are] <you>?"],
            ["{Which}", "hangi(si)?", "{Which} bus [goes] to Kadıköy?"],
            ["{Whose}", "kimin?", "{Whose} bag [is] this?"],
          ],
        },
      },
      {
        title: "Kalıp: soru kelimesi + yardımcı + özne + fiil",
        body: "Soru kelimesi en başa gelir; arkasından evet / hayır sorusundaki sıra aynen korunur.",
        table: {
          head: ["Soru kelimesi", "Yardımcı", "Özne", "Geri kalanı"],
          rows: [
            ["{Where}", "[do]", "<you>", "live?"],
            ["{What}", "[does]", "<she>", "do?"],
            ["{Why}", "[are]", "<they>", "late?"],
            ["{When}", "[can]", "<we>", "meet?"],
          ],
        },
        examples: [
          { en: "{Where} [do] <you> buy your bread?", tr: "Ekmeğini nereden alırsın?" },
          { en: "{What time} [does] <the film> start?", tr: "Film saat kaçta başlıyor?" },
          { en: "{Why} [is] <the baby> crying?", tr: "Bebek neden ağlıyor?" },
        ],
      },
      {
        title: "How ile sorular",
        body: "How tek başına 'nasıl'. Arkasına bir kelime gelince yeni sorular çıkar:",
        table: {
          head: ["Soru", "Türkçe", "Örnek"],
          rows: [
            ["{How much}", "ne kadar (fiyat, sayılamayan)", "{How much} is this jacket?"],
            ["{How many}", "kaç tane", "{How many} brothers have you got?"],
            ["{How old}", "kaç yaşında", "{How old} is your son?"],
            ["{How often}", "ne sıklıkla", "{How often} do you swim?"],
            ["{How long}", "ne kadar süre", "{How long} is the film?"],
            ["{How far}", "ne kadar uzak", "{How far} is the airport?"],
          ],
        },
      },
      {
        title: "Who: özneyi mi soruyor?",
        body: "Who cümlenin öznesini soruyorsa do / does gelmez, fiil he / she / it gibi davranır: {Who} lives here? Nesneyi soruyorsa yardımcı gelir: {Who} [do] <you> live with?",
        examples: [
          { en: "{Who} wants tea?", tr: "Kim çay ister?" },
          { en: "{Who} [did] <you> see at the party?", tr: "Partide kimi gördün?" },
          { en: "{What} happened?", tr: "Ne oldu?" },
        ],
      },
    ],
    mistakes: [
      { wrong: "Where ~~you live~~?", right: "{Where} [do] <you> live?", why: "Yardımcı fiil (do) unutulmaz." },
      { wrong: "What ~~she does~~?", right: "{What} [does] <she> do?", why: "Sıra: soru kelimesi + does + özne + fiil." },
      { wrong: "How ~~much~~ brothers have you got?", right: "{How many} brothers have you got?", why: "Sayılabilen şeyler: how many." },
      { wrong: "Who ~~does live~~ here?", right: "{Who} lives here?", why: "Who özneyi soruyorsa do / does yok." },
    ],
    tip: "Önce evet / hayır sorusunu kur: [Do] <you> live in İzmir? Sonra başa soru kelimesini ekle, cevabı at: {Where} [do] <you> live? Sıra hiç bozulmaz.",
    quiz: [
      { kind: "choice", prompt: "___ do you live? — In Eskişehir.", tr: "Nerede yaşıyorsun? — Eskişehir'de.", options: ["What", "Where", "When"], answer: 1, explain: "Yer soruluyor: **Where**." },
      { kind: "choice", prompt: "___ is your birthday? — In June.", tr: "Doğum günün ne zaman? — Haziranda.", options: ["When", "Who", "Why"], answer: 0, explain: "Zaman soruluyor: **When**." },
      { kind: "choice", prompt: "How ___ people are at the party?", tr: "Partide kaç kişi var?", options: ["much", "many", "old"], answer: 1, explain: "Sayılabilen: How **many**." },
      { kind: "choice", prompt: "What ___ your father do?", tr: "Baban ne iş yapıyor?", options: ["do", "does", "is"], answer: 1, explain: "your father = he → **does**." },
      { kind: "choice", prompt: "___ is the station from here? — About two kilometres.", tr: "İstasyon buradan ne kadar uzak? — Yaklaşık iki kilometre.", options: ["How long", "How far", "How much"], answer: 1, explain: "Mesafe: **How far**." },
      { kind: "type", prompt: "___ often do you go to the cinema?", tr: "Sinemaya ne sıklıkla gidersin?", answer: ["How"], explain: "Ne sıklıkla → **How** often." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["Who does live here?", "Who lives here?", "Who live here?"], answer: 1, explain: "Who özneyi soruyor: do yok, fiil -s alır → **Who lives here?**" },
      { kind: "order", tr: "Film saat kaçta başlıyor?", answer: "What time does the film start?", extra: ["starts", "is"], explain: "Wh + **does** + özne + yalın fiil." },
      { kind: "order", tr: "Bu çanta kimin?", answer: "Whose bag is this?", extra: ["Who", "Who's"], explain: "Kimin → **Whose** (Who's = who is)." },
      { kind: "type", prompt: "How ___ does the ticket cost?", tr: "Bilet ne kadar tutuyor?", answer: ["much"], explain: "Fiyat: How **much**." },
    ],
  },

  "sentence-building": {
    intro: "Türkçede fiil sonda: 'Ben her sabah kahve içerim.' İngilizcede fiil öznenin hemen arkasında: 'I drink coffee every morning.' Bu tek kural cümlelerinin yarısını düzeltir.",
    legend: { partner: "özne", focus: "fiil", extra: "nesne / yer / zaman" },
    sections: [
      {
        title: "Özne + fiil + nesne",
        body: "İngilizce cümlenin iskeleti: [özne] + {fiil} + <nesne>. Türkçede fiil sondadır; İngilizcede fiili sondan alıp öznenin yanına koyarsın.",
        table: {
          head: ["", "Özne", "Fiil", "Nesne"],
          rows: [
            ["İngilizce", "[I]", "{love}", "<pizza>."],
            ["Türkçe", "[Ben]", "<pizzayı>", "{severim}."],
          ],
        },
        examples: [
          { en: "[She] {speaks} <three languages>.", tr: "[O] <üç dil> {konuşuyor}." },
          { en: "[My friends] {play} <football>.", tr: "[Arkadaşlarım] <futbol> {oynar}." },
          { en: "[The kids] {love} <this park>.", tr: "[Çocuklar] <bu parkı> {çok sever}." },
        ],
      },
      {
        title: "Yer ve zaman sona",
        body: "Yer ve zaman bilgisi genelde cümlenin sonuna gelir. Sıra: ne → nerede → ne zaman.",
        table: {
          head: ["Özne + fiil", "Nesne", "Yer", "Zaman"],
          rows: [
            ["[I] {study}", "<English>", "<at home>", "<every day>."],
            ["[We] {watched}", "<a film>", "<at the cinema>", "<last night>."],
          ],
        },
        examples: [
          { en: "[I] {meet} <my friends> <in Kadıköy> <on Fridays>.", tr: "Cuma günleri Kadıköy'de arkadaşlarımla buluşurum." },
          { en: "[She] {left} <her keys> <in the car> <this morning>.", tr: "Bu sabah anahtarlarını arabada unuttu." },
        ],
      },
      {
        title: "Öznesiz cümle olmaz",
        body: "Türkçede 'Geliyorum' tek başına yeter; İngilizcede özne şart: [I]'m coming. Hava, saat, mesafe için bile bir özne vardır: [It].",
        examples: [
          { en: "[It] {is} cold today.", tr: "Bugün hava soğuk." },
          { en: "[It]'s late. Let's go.", tr: "Geç oldu. Gidelim." },
          { en: "[I] {am} tired.", tr: "Yorgunum." },
          { en: "[It] {takes} <twenty minutes> by bus.", tr: "Otobüsle yirmi dakika sürüyor." },
        ],
      },
      {
        title: "Cümleleri bağla",
        body: "İki basit cümleyi and, but, because, so ile birleştir. İki tarafta da özne + fiil korunur.",
        examples: [
          { en: "[I] {like} <tea>, but [my wife] {prefers} <coffee>.", tr: "Ben çayı severim ama karım kahveyi tercih eder." },
          { en: "[I] {stayed} <at home> because [I] {was} sick.", tr: "Hastaydım, o yüzden evde kaldım." },
          { en: "[It] {was} late, so [we] {took} <a taxi>.", tr: "Geç olmuştu, o yüzden taksiye bindik." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I ~~every morning coffee drink~~.", right: "[I] {drink} <coffee> <every morning>.", why: "Fiil öznenin hemen arkasına; zaman sona." },
      { wrong: "~~Is~~ very cold.", right: "[It] {is} very cold.", why: "Özne şart: It." },
      { wrong: "~~Me~~ like music.", right: "[I] {like} music.", why: "Özne olarak I kullanılır; me nesnedir." },
      { wrong: "She speaks ~~very well English~~.", right: "[She] {speaks} <English> very well.", why: "Nesne fiilin hemen arkasında; very well sona." },
    ],
    tip: "Türkçe cümleni kur, sonra fiili sondan kopar ve öznenin yanına yapıştır: 'Ben / kahve / içerim' → '[I] / {drink} / <coffee>'.",
    quiz: [
      { kind: "choice", prompt: "Hangisi doğru?", options: ["I English study every day.", "I study English every day.", "Every day I English study."], answer: 1, explain: "Özne + **fiil** + nesne + zaman." },
      { kind: "choice", prompt: "___ is raining again.", tr: "Yine yağmur yağıyor.", options: ["It", "—", "There"], answer: 0, explain: "Hava için bile özne: **It** is raining." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["She plays very well the piano.", "She plays the piano very well.", "She very well plays the piano."], answer: 1, explain: "Nesne fiilin arkasında, very well sonda." },
      { kind: "type", prompt: "___ is a long way to the airport.", tr: "Havaalanına çok yol var.", answer: ["It"], explain: "Mesafe için özne: **It** is a long way…" },
      { kind: "choice", prompt: "I was tired, ___ I went to bed early.", tr: "Yorgundum, o yüzden erken yattım.", options: ["because", "so", "but"], answer: 1, explain: "Sonuç: **so**." },
      { kind: "order", tr: "Her gün evde İngilizce çalışırım.", answer: "I study English at home every day.", extra: ["studies", "in"], explain: "Özne + fiil + nesne + yer + zaman." },
      { kind: "order", tr: "Kardeşim her sabah parkta koşar.", answer: "My brother runs in the park every morning.", extra: ["run", "on"], explain: "Özne + fiil (-s!) + yer + zaman." },
      { kind: "order", tr: "Dün akşam sinemada bir film izledik.", answer: "We watched a film at the cinema last night.", extra: ["watch", "yesterday"], explain: "Ne → nerede → ne zaman." },
      { kind: "type", prompt: "___ takes ten minutes to walk there.", tr: "Oraya yürümek on dakika sürüyor.", answer: ["It"], explain: "Süre için özne: **It** takes…" },
      { kind: "choice", prompt: "I like dogs, ___ my husband likes cats.", tr: "Ben köpekleri severim ama kocam kedileri sever.", options: ["and", "but", "because"], answer: 1, explain: "Zıtlık: **but**." },
    ],
  },

  "to-by-from": {
    intro: "Üç küçük edat, üç soru: nereye (to), nereden (from), nasıl ya da kimin tarafından (by). Türkçede bunlar ek: -e, -den, ile.",
    legend: { focus: "to · by · from", partner: "yer / kişi / araç / zaman" },
    sections: [
      {
        title: "to: -e, -a",
        body: "Gidilen yer, bir şeyin verildiği kişi, bir sürenin bitişi: {to}. Türkçedeki '-e / -a' eki.",
        examples: [
          { en: "I go {to} [work] by bus.", tr: "İşe otobüsle giderim." },
          { en: "Give it {to} [me], please.", tr: "Onu bana ver lütfen." },
          { en: "We're flying {to} [London] tomorrow.", tr: "Yarın Londra'ya uçuyoruz." },
          { en: "It's ten {to} [five].", tr: "Beşe on var." },
        ],
        note: "home ile to kullanılmaz: I go home. Aynı şekilde: go there, go abroad.",
      },
      {
        title: "from: -den, -dan",
        body: "Başlangıç noktası, köken, gönderen: {from}. Türkçedeki '-den / -dan'.",
        examples: [
          { en: "I'm {from} [Trabzon].", tr: "Trabzonluyum." },
          { en: "This email is {from} [my boss].", tr: "Bu e-posta patronumdan." },
          { en: "I work {from} [nine] {to} [six].", tr: "Dokuzdan altıya kadar çalışırım." },
          { en: "Take the milk {from} [the fridge].", tr: "Sütü buzdolabından al." },
        ],
      },
      {
        title: "by: ile, tarafından, en geç",
        table: {
          head: ["Anlam", "Örnek", "Türkçe"],
          rows: [
            ["ulaşım (ile)", "{by} [bus] · {by} [car] · {by} [train]", "otobüsle, arabayla, trenle"],
            ["yapan (tarafından)", "a novel {by} [Orhan Pamuk]", "Orhan Pamuk'un bir romanı"],
            ["son an (en geç)", "{by} [Friday]", "en geç cumaya kadar"],
            ["hemen yanında", "{by} [the window]", "pencerenin yanında"],
          ],
        },
        note: "Yürüyerek = on foot (by foot değil). Ulaşımda the yok: {by} [car], ~~by the car~~.",
      },
      {
        title: "Üçü bir arada",
        examples: [
          { en: "I travel {from} [Ankara] {to} [İzmir] {by} [train].", tr: "Ankara'dan İzmir'e trenle giderim." },
          { en: "Please send the report {to} [Selin] {by} [Monday].", tr: "Raporu en geç pazartesiye Selin'e gönder lütfen." },
          { en: "This photo was taken {by} [my grandfather] in 1970.", tr: "Bu fotoğraf 1970'te dedem tarafından çekildi." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I go ~~to home~~.", right: "I go home.", why: "home ile to kullanılmaz." },
      { wrong: "I come ~~by the bus~~.", right: "I come {by} [bus].", why: "Ulaşımda by + the'siz araç." },
      { wrong: "I go to work ~~by foot~~.", right: "I go to work on foot.", why: "Yürüyerek = on foot." },
      { wrong: "Finish it ~~until~~ Friday.", right: "Finish it {by} [Friday].", why: "'En geç cuma' = by. until, cumaya kadar süren bir durumu anlatır." },
    ],
    tip: "Türkçe eki düşün: -e → {to}, -den → {from}, 'ile' (araç) → {by}. to ileri gider, from geriden gelir, by yanında durur.",
    quiz: [
      { kind: "choice", prompt: "I'm ___ Antalya.", tr: "Antalyalıyım.", options: ["from", "to", "by"], answer: 0, explain: "Köken: **from**." },
      { kind: "choice", prompt: "We went to Bursa ___ car.", tr: "Bursa'ya arabayla gittik.", options: ["with", "by", "from"], answer: 1, explain: "Ulaşım: **by** car." },
      { kind: "choice", prompt: "Can you send this ___ Ahmet?", tr: "Bunu Ahmet'e gönderebilir misin?", options: ["to", "from", "by"], answer: 0, explain: "Alan kişi: **to** Ahmet." },
      { kind: "choice", prompt: "I have to finish the project ___ Friday.", tr: "Projeyi en geç cumaya bitirmem lazım.", options: ["until", "by", "to"], answer: 1, explain: "Son an: **by** Friday." },
      { kind: "type", prompt: "The shop is open ___ nine to five.", tr: "Dükkân dokuzdan beşe açık.", answer: ["from"], explain: "**from** … to …" },
      { kind: "type", prompt: "This book was written ___ a young Turkish writer.", tr: "Bu kitap genç bir Türk yazar tarafından yazıldı.", answer: ["by"], explain: "Yapan kişi: **by**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I go home by bus.", "I go to home by bus.", "I come from Rize."], answer: 1, explain: "home ile to yok: **go home**." },
      { kind: "order", tr: "Her gün trenle işe giderim.", answer: "I go to work by train every day.", extra: ["from", "the"], explain: "to work (nereye) + by train (nasıl)." },
      { kind: "order", tr: "Bu mektup annemden.", answer: "This letter is from my mother.", extra: ["to", "by"], explain: "Gönderen: **from**." },
      { kind: "choice", prompt: "I walk to school. I go ___.", tr: "Okula yürüyerek giderim.", options: ["by foot", "on foot", "with foot"], answer: 1, explain: "Yürüyerek: **on foot**." },
    ],
  },

  numbers: {
    intro: "Sayılar her yerde: fiyat, saat, telefon, yaş. Zor olan sayılar değil, okunuşları: thirteen mi dedi, thirty mi?",
    legend: { focus: "sayı", partner: "rakam" },
    sections: [
      {
        title: "0–20",
        table: {
          head: ["", "İngilizce", "", "İngilizce"],
          rows: [
            ["[0]", "zero", "[11]", "eleven"],
            ["[1]", "one", "[12]", "twelve"],
            ["[2]", "two", "[13]", "thir{teen}"],
            ["[3]", "three", "[14]", "four{teen}"],
            ["[4]", "four", "[15]", "fif{teen}"],
            ["[5]", "five", "[16]", "six{teen}"],
            ["[6]", "six", "[17]", "seven{teen}"],
            ["[7]", "seven", "[18]", "eigh{teen}"],
            ["[8]", "eight", "[19]", "nine{teen}"],
            ["[9]", "nine", "[20]", "twen{ty}"],
            ["[10]", "ten", "", ""],
          ],
        },
      },
      {
        title: "-teen mi, -ty mi?",
        body: "13–19 '-teen' ile biter ve vurgu sondadır: thir-{TEEN}. 30, 40… '-ty' ile biter ve vurgu baştadır: {THIR}-ty. Dinlerken ikisini vurgudan ayırırsın.",
        table: {
          head: ["-teen (13–19)", "-ty (20–90)"],
          rows: [
            ["thir{teen} · 13", "{thir}ty · 30"],
            ["four{teen} · 14", "{for}ty · 40"],
            ["fif{teen} · 15", "{fif}ty · 50"],
            ["six{teen} · 16", "{six}ty · 60"],
            ["seven{teen} · 17", "{seven}ty · 70"],
            ["eigh{teen} · 18", "{eigh}ty · 80"],
            ["nine{teen} · 19", "{nine}ty · 90"],
          ],
        },
        note: "forty'de u yok: four → forty. fifteen ve fifty'de v yok: five → fif-.",
      },
      {
        title: "Büyük sayılar",
        body: "100 = a / one {hundred}, 1.000 = a {thousand}, 1.000.000 = a {million}. İngiltere'de yüzlerden sonra and gelir: 245 = two hundred {and} forty-five. Onlar ile birler arasına tire gelir: forty{-}five.",
        examples: [
          { en: "[245] — two {hundred} and forty-five", tr: "iki yüz kırk beş" },
          { en: "[1,500] — one {thousand} five {hundred}", tr: "bin beş yüz" },
          { en: "[2026] — twenty twenty-six", tr: "iki bin yirmi altı (yıl olarak)" },
          { en: "[3,000,000] — three {million}", tr: "üç milyon" },
        ],
        note: "İngilizcede binler virgülle, ondalık noktayla yazılır: 1,500 = bin beş yüz; 1.5 = bir buçuk (one point five). Sayıdan sonra hundred / thousand çoğul olmaz: two {hundred} people.",
      },
      {
        title: "Günlük hayatta",
        examples: [
          { en: "How much is it? — It's {fifteen} pounds.", tr: "Ne kadar? — On beş sterlin." },
          { en: "My number is oh-five-three-two, double {four}…", tr: "Numaram sıfır beş üç iki, dört dört…" },
          { en: "I'm {thirty-four}.", tr: "Otuz dört yaşındayım." },
          { en: "There are {twenty-one} people in my class.", tr: "Sınıfımda yirmi bir kişi var." },
        ],
        note: "Telefon numarasında 0 çoğu zaman 'oh' okunur, yan yana aynı iki rakam 'double': 55 = double five.",
      },
    ],
    mistakes: [
      { wrong: "two ~~hundreds~~ people", right: "two {hundred} people", why: "Sayıdan sonra hundred / thousand çoğul olmaz." },
      { wrong: "~~fourty~~", right: "{forty}", why: "forty'de u yok." },
      { wrong: "twenty ~~and~~ one", right: "{twenty-one}", why: "Onlar ve birler arasına tire gelir, and gelmez." },
      { wrong: "I ~~have thirty years~~.", right: "I'm {thirty}.", why: "Yaş be ile söylenir; istersen 'years old' eklenir." },
    ],
    tip: "On üçle otuzu karıştırıyorsan vurguyu dinle: thir-{TEEN} (sonu güçlü), {THIR}-ty (başı güçlü). Söylerken sen de vurguyu abart.",
    quiz: [
      { kind: "choice", prompt: "15 = ?", options: ["fiveteen", "fifteen", "fifty"], answer: 1, explain: "five → **fif**teen." },
      { kind: "choice", prompt: "40 = ?", options: ["fourty", "forty", "fourteen"], answer: 1, explain: "u yok: **forty**." },
      { kind: "choice", prompt: "There were three ___ people at the concert.", tr: "Konserde üç yüz kişi vardı.", options: ["hundred", "hundreds", "hundreds of"], answer: 0, explain: "Sayıdan sonra çoğul yok: three **hundred**." },
      { kind: "type", prompt: "19 = ___", answer: ["nineteen"], explain: "nine + teen: **nineteen** (e kalır)." },
      { kind: "type", prompt: "80 = ___", answer: ["eighty"], explain: "eight + y: **eighty** (tek t)." },
      { kind: "choice", prompt: "'Thirteen' hangi sayı?", options: ["30", "13", "3"], answer: 1, explain: "-teen: **13**. (30 = thirty)" },
      { kind: "choice", prompt: "1,250 = ?", tr: "bin iki yüz elli", options: ["one thousand two hundreds and fifty", "one thousand two hundred and fifty", "one thousand and two hundred fifty"], answer: 1, explain: "hundred çoğul olmaz; son kısımdan önce and: **one thousand two hundred and fifty**." },
      { kind: "choice", prompt: "1.5 nasıl okunur?", options: ["one comma five", "one point five", "one and five"], answer: 1, explain: "Ondalık nokta: one **point** five." },
      { kind: "order", tr: "Otuz dört yaşındayım.", answer: "I am thirty-four years old.", extra: ["have", "thirty"], explain: "Yaş be ile: I **am** thirty-four." },
      { kind: "type", prompt: "Telefonda 77 = double ___", answer: ["seven"], explain: "Aynı iki rakam: double **seven**." },
    ],
  },

  "ordinals-frequency": {
    intro: "Sıra sayıları sırayı söyler (birinci, ikinci), sıklık sözleri ne kadar sık olduğunu (her zaman, bazen, asla). İkisi de takvimde, programda, sohbette her gün karşına çıkar.",
    legend: { focus: "sıra / sıklık", partner: "fiil", extra: "süre" },
    sections: [
      {
        title: "Sıra sayıları",
        table: {
          head: ["Sayı", "Sıra", "Kısa"],
          rows: [
            ["one", "{first}", "1st"],
            ["two", "{second}", "2nd"],
            ["three", "{third}", "3rd"],
            ["four", "four{th}", "4th"],
            ["five", "{fifth}", "5th"],
            ["eight", "eigh{th}", "8th"],
            ["nine", "{ninth}", "9th"],
            ["twelve", "{twelfth}", "12th"],
            ["twenty", "twentie{th}", "20th"],
            ["twenty-one", "twenty-{first}", "21st"],
          ],
        },
        note: "İlk üçü düzensiz: first, second, third. Gerisi -th alır. Dikkat: five → {fifth}, twelve → {twelfth}, nine → {ninth} (e düşer).",
      },
      {
        title: "Tarih, kat, sıralama",
        body: "Tarihte the ve of da gelir: the {23rd} of September. Amerikan kullanımı: September {23rd}. Katlarda ve sıralamalarda da hep sıra sayısı.",
        examples: [
          { en: "My birthday is on the {fifth} of May.", tr: "Doğum günüm beş mayısta." },
          { en: "We live on the {third} floor.", tr: "Üçüncü katta oturuyoruz." },
          { en: "This is my {first} time in London.", tr: "Londra'ya ilk gelişim." },
          { en: "She finished {second} in the race.", tr: "Yarışı ikinci bitirdi." },
        ],
      },
      {
        title: "Sıklık sözleri",
        table: {
          head: ["Söz", "Türkçe", "Ne kadar?"],
          rows: [
            ["{always}", "her zaman", "%100"],
            ["{usually}", "genellikle", "%80"],
            ["{often}", "sık sık", "%60"],
            ["{sometimes}", "bazen", "%40"],
            ["{rarely}", "nadiren", "%10"],
            ["{never}", "asla, hiç", "%0"],
          ],
        },
        body: "Yeri: asıl fiilin önü, ama am / is / are'ın arkası: I {usually} [get up] at seven. / She [is] {always} late.",
        examples: [
          { en: "I {usually} [walk] to work.", tr: "Genellikle işe yürüyerek giderim." },
          { en: "He [is] {never} late.", tr: "Asla geç kalmaz." },
          { en: "We {sometimes} [eat] out on Fridays.", tr: "Cuma günleri bazen dışarıda yeriz." },
        ],
      },
      {
        title: "Kaç kez? once, twice, three times",
        body: "Sıklığı saymak için: {once} (bir kez), {twice} (iki kez), {three times} (üç kez)… ardından süre: <a day>, <a week>, <a month>. Soru: How often…?",
        table: {
          head: ["İfade", "Türkçe"],
          rows: [
            ["{once} <a week>", "haftada bir"],
            ["{twice} <a month>", "ayda iki kez"],
            ["{three times} <a day>", "günde üç kez"],
            ["{every} <day>", "her gün"],
            ["{every other} <day>", "gün aşırı"],
          ],
        },
        examples: [
          { en: "How often do you go to the gym? — {Twice} <a week>.", tr: "Spora ne sıklıkla gidersin? — Haftada iki kez." },
          { en: "Take this medicine {three times} <a day>.", tr: "Bu ilacı günde üç kez al." },
        ],
      },
    ],
    mistakes: [
      { wrong: "the ~~two~~ floor", right: "the {second} floor", why: "Kat ve sıralama: sıra sayısı." },
      { wrong: "I ~~go always~~ to the gym.", right: "I {always} [go] to the gym.", why: "Sıklık sözü asıl fiilin önüne." },
      { wrong: "She ~~always is~~ tired.", right: "She [is] {always} tired.", why: "be fiilinin arkasına gelir." },
      { wrong: "the ~~fiveth~~ of June", right: "the {fifth} of June", why: "five → fifth (v yerine f)." },
    ],
    tip: "Sıklık sözünü cümlenin kalbine, fiilin hemen önüne koy: I {often} [cook]. Tek istisna be: I'm {often} tired.",
    quiz: [
      { kind: "choice", prompt: "We live on the ___ floor.", tr: "Dördüncü katta oturuyoruz.", options: ["four", "fourth", "forth"], answer: 1, explain: "Kat: sıra sayısı → **fourth**." },
      { kind: "choice", prompt: "How often do you see her? — ___", tr: "Onu ne sıklıkla görüyorsun? — Ayda iki kez.", options: ["Twice a month.", "Two month.", "Second a month."], answer: 0, explain: "Kaç kez: **Twice a month**." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["She never is late.", "She is never late.", "Never she is late."], answer: 1, explain: "be'nin arkasında: is **never**." },
      { kind: "type", prompt: "Today is the ___ of May. (22)", tr: "Bugün 22 mayıs.", answer: ["twenty-second", "22nd"], explain: "22 → **twenty-second** (son rakam 2 → second)." },
      { kind: "type", prompt: "I go swimming ___ a week. (2 kez)", tr: "Haftada iki kez yüzmeye giderim.", answer: ["twice", "two times"], explain: "İki kez → **twice**." },
      { kind: "choice", prompt: "12. = ?", options: ["twelveth", "twelfth", "twelvth"], answer: 1, explain: "twelve → **twelfth**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I often cook dinner.", "She is never late.", "We go always to the gym."], answer: 2, explain: "Sıklık sözü fiilin önüne: We **always go** to the gym." },
      { kind: "order", tr: "Genellikle işe otobüsle giderim.", answer: "I usually go to work by bus.", extra: ["always", "on"], explain: "Sıklık sözü fiilin önünde." },
      { kind: "order", tr: "Günde üç kez kahve içerim.", answer: "I drink coffee three times a day.", extra: ["once", "twice"], explain: "Sayı + times + a day." },
      { kind: "choice", prompt: "How ___ do you visit your parents? — Every weekend.", tr: "Aileni ne sıklıkla ziyaret edersin? — Her hafta sonu.", options: ["often", "many", "much"], answer: 0, explain: "Sıklık sorusu: How **often**." },
    ],
  },
};
