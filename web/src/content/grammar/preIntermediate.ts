import type { TopicBody } from "./types";

/** Pre-intermediate: likes, articles, countables, there is, quantifiers, present continuous, imperatives, linking words, the future. */
export const PRE_INTERMEDIATE: Record<string, TopicBody> = {
  "likes-dislikes": {
    intro: "'Kahveyi severim, sabah erken kalkmaktan nefret ederim.' Sevdiğini ve sevmediğini söylemek sohbetin yarısıdır. İngilizcede bunun bir merdiveni var: love, like, don't mind, don't like, hate.",
    glance: {
      idea: "Ne kadar sevdiğini bir merdivenle söylersin: {love}, {like}, {don't mind}, {don't like}, {hate}. Arkasına bir <isim> ya da fiilin <-ing> hâli gelir.",
      formulas: [
        {
          label: "İsimle",
          parts: [
            { text: "I", role: "partner", name: "özne" },
            { text: "love", role: "focus", name: "sevme fiili" },
            { text: "coffee.", role: "extra", name: "isim" },
          ],
        },
        {
          label: "Fiille",
          parts: [
            { text: "We", role: "partner", name: "özne" },
            { text: "don't mind", role: "focus", name: "sevme fiili" },
            { text: "waiting.", role: "extra", name: "fiil + -ing" },
          ],
        },
        {
          label: "Soru",
          parts: [
            { text: "Do", role: "plain", name: "do · does" },
            { text: "you", role: "partner", name: "özne" },
            { text: "like", role: "focus", name: "sevme fiili" },
            { text: "cooking?", role: "extra", name: "isim ya da -ing" },
          ],
        },
      ],
      compare: [
        { tr: "[Ben] <kahve> {severim}.", en: "[I] {like} <coffee>." },
        { tr: "<Yüzmeye> {bayılırım}.", en: "[I] {love} <swimming>." },
        { tr: "Erken <kalkmaktan> {nefret ederim}.", en: "[I] {hate} <getting up> early." },
      ],
      compareNote: "Türkçede sevme fiili sona gelir, önündeki fiil '-meyi, -meye, -mekten' gibi bir ek alır; İngilizcede sevme fiili öne geçer, arkasındaki fiil -ing alır.",
    },
    legend: { partner: "özne", focus: "sevme fiili", extra: "-ing / isim" },
    sections: [
      {
        title: "Merdiven",
        body: "Bu fiiller sevgiden nefrete doğru bir merdiven kurar: en üstte {love}, en altta {hate}. Ortadaki {don't mind} 'fark etmez, olur' demek. {enjoy} (keyif almak) da {like} gibi kullanılır: I {enjoy} <reading>.",
        table: {
          head: ["İfade", "Türkçe", ""],
          rows: [
            ["{love}", "çok severim, bayılırım", "😍"],
            ["{really like}", "gerçekten severim", "😄"],
            ["{like}", "severim", "🙂"],
            ["{don't mind}", "fark etmez, olur", "😐"],
            ["{don't like}", "sevmem", "🙁"],
            ["{can't stand}", "hiç çekemem", "😖"],
            ["{hate}", "nefret ederim", "😡"],
          ],
        },
      },
      {
        title: "Arkasından ne gelir?",
        body: "Sevme fiilinden sonra ya bir isim gelir ya da bir fiilin <-ing> hâli: I {love} <coffee>. / I {hate} <getting up> early. Türkçedeki '-meyi, -mekten' ekinin işini -ing yapar: yüzmeyi → <swimming>.",
        examples: [
          { en: "[I] {love} <cooking> for my friends.", tr: "Arkadaşlarıma yemek yapmayı çok severim." },
          { en: "[She] {doesn't like} <horror films>.", tr: "Korku filmlerini sevmez." },
          { en: "[We] {don't mind} <waiting>.", tr: "Beklemek bizim için sorun değil." },
          { en: "[My dad] {hates} <loud music>.", tr: "Babam yüksek sesli müzikten nefret eder." },
        ],
        note: "{don't mind} ve {enjoy}'dan sonra hep -ing gelir: I {don't mind} <waiting>, ~~to wait~~ değil.",
      },
      {
        title: "Sormak ve cevaplamak",
        body: "Soru, geniş zamandaki gibi do / does ile kurulur: Do [you] {like}…? / Does [she] {like}…? Kısa cevapta like tekrarlanmaz: Yes, I do. / No, I don't. Daha doğal cevaplar da var: 'I love it!', 'Not really.', 'It's okay.'",
        examples: [
          { en: "Do [you] {like} <jazz>? — Yes, I love it!", tr: "Caz sever misin? — Evet, bayılırım!" },
          { en: "Does [your sister] {like} <cats>? — Not really.", tr: "Kız kardeşin kedileri sever mi? — Pek değil." },
          { en: "What do [you] {like} <doing> at the weekend?", tr: "Hafta sonu ne yapmayı seversin?" },
        ],
      },
      {
        title: "would like: şu anki istek",
        body: "{like} 'genelde severim' der; I{'d like} (= I {would like}) ise 'şu an istiyorum, rica ederim'. Bir alışkanlık değil, o anki kibar isteğindir; sipariş verirken bunu kullan. Arkasından bir isim ya da to + fiil gelir.",
        table: {
          head: ["", "like", "would like"],
          rows: [
            ["Anlamı", "genel olarak severim", "şimdi istiyorum"],
            ["İsimle", "I {like} <tea>.", "I{'d like} <a tea>, please."],
            ["Fiille", "I {like} <swimming>.", "I{'d like} <to swim>."],
          ],
        },
        examples: [
          { en: "[I]{'d like} <a coffee>, please.", tr: "Bir kahve rica edeyim." },
          { en: "Would [you] {like} <to come> with us?", tr: "Bizimle gelmek ister misin?" },
        ],
      },
    ],
    mistakes: [
      { wrong: "I like ~~very much coffee~~.", right: "[I] {like} <coffee> very much.", why: "very much cümlenin sonuna gelir." },
      { wrong: "I don't mind ~~to wait~~.", right: "[I] {don't mind} <waiting>.", why: "don't mind'dan sonra -ing." },
      { wrong: "She ~~don't like~~ fish.", right: "[She] {doesn't like} fish.", why: "he / she / it → doesn't." },
      { wrong: "~~I like a coffee~~, please.", right: "[I]{'d like} <a coffee>, please.", why: "Şu anki istek: would like." },
    ],
    tip: "Merdiveni ezbere bil: {love}, {like}, {don't mind}, {don't like}, {can't stand}, {hate}. Arkasına <-ing> koy: I {love} <reading>. Sipariş verirken 'like' değil, I{'d like}.",
    quiz: [
      { kind: "choice", prompt: "I ___ getting up early. It's terrible!", tr: "Erken kalkmaktan nefret ederim. Berbat!", options: ["love", "hate", "don't mind"], answer: 1, explain: "Berbat diyorsa: **hate**." },
      { kind: "choice", prompt: "I don't mind ___ the dishes.", tr: "Bulaşık yıkamak bana dert değil.", options: ["to wash", "washing", "wash"], answer: 1, explain: "don't mind + **-ing**." },
      { kind: "choice", prompt: "My mum ___ like spicy food.", tr: "Annem acılı yemek sevmez.", options: ["don't", "doesn't", "isn't"], answer: 1, explain: "My mum = she → **doesn't**." },
      { kind: "choice", prompt: "___ a glass of water, please.", tr: "Bir bardak su rica edeyim.", options: ["I like", "I'd like", "I liking"], answer: 1, explain: "Şu anki istek: **I'd like**." },
      { kind: "type", prompt: "[They] love ___ football on Sundays.", tr: "Pazar günleri futbol oynamaya bayılırlar. (play)", answer: ["playing", "to play"], explain: "love + **playing**." },
      { kind: "type", prompt: "Would you like ___ come with us?", tr: "Bizimle gelmek ister misin?", answer: ["to"], explain: "would like + **to** + fiil." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I'd like a tea, please.", "Do you like swimming?", "She doesn't mind to cook."], answer: 2, explain: "don't mind + -ing: She doesn't mind **cooking**." },
      { kind: "order", tr: "Arkadaşlarımla sinemaya gitmeyi severim.", answer: "I like going to the cinema with my friends.", extra: ["go", "likes"], explain: "like + **going**." },
      { kind: "order", tr: "Babam yüksek sesli müzikten nefret eder.", answer: "My dad hates loud music.", extra: ["hate", "loves"], explain: "Nefret: **hates** + isim (my dad = he → -s)." },
      { kind: "choice", prompt: "Do you like jazz? — Yes, I ___.", tr: "Caz sever misin? — Evet, severim.", options: ["like", "do", "am"], answer: 1, explain: "Kısa cevap: Yes, I **do**." },
    ],
  },

  articles: {
    intro: "Türkçede 'bir' var ama 'the' yok. İngilizcede neredeyse her ismin önünde bir karar verilir: a mı, an mı, the mı, hiçbiri mi? Kural az, örnek çok.",
    glance: {
      idea: "Her ismin önünde bir karar var: herhangi biriyse {a / an}, hangisi olduğu belliyse {the}, genel konuşuyorsan hiçbiri.",
      formulas: [
        {
          label: "Herhangi bir",
          parts: [
            { text: "I've got", role: "plain" },
            { text: "a", role: "focus", name: "a · an" },
            { text: "dog.", role: "partner", name: "tekil isim" },
          ],
        },
        {
          label: "Belli olan",
          parts: [
            { text: "The", role: "focus", name: "the" },
            { text: "dog", role: "partner", name: "bildiğimiz isim" },
            { text: "is black.", role: "plain" },
          ],
        },
        {
          label: "Genel",
          parts: [
            { text: "I love", role: "plain" },
            { text: "dogs.", role: "partner", name: "a / the yok" },
          ],
        },
      ],
      compare: [
        { tr: "{Bir} [köpeğim] var.", en: "I've got {a} [dog]." },
        { tr: "[Köpek] siyah.", en: "{The} [dog] is black." },
        { tr: "[Köpekleri] severim.", en: "I love [dogs]." },
      ],
      compareNote: "Türkçede 'the' yoktur; hangi köpek olduğu cümleden anlaşılır. İngilizcede bildiğimiz şeyin önüne {the} gelir, genel konuşurken hiçbir şey gelmez.",
    },
    legend: { focus: "a · an · the", partner: "isim" },
    sections: [
      {
        title: "a / an: herhangi bir",
        body: "Tek tane olan, sayılabilen (tek tek sayılan) ve ilk kez söz ettiğin bir şeyin önüne {a} ya da {an} gelir, Türkçedeki 'bir' gibi: I've got {a} [dog]. Kelime sesli bir harfin **sesiyle** başlıyorsa {an}: {an} [apple], {an} [hour]. Ötekiler {a} alır: {a} [car], {a} [university].",
        examples: [
          { en: "There's {a} [cat] in the garden.", tr: "Bahçede bir kedi var." },
          { en: "She's {an} [engineer].", tr: "Mühendis." },
          { en: "I walk for {an} [hour] every day.", tr: "Her gün bir saat yürürüm." },
          { en: "It's {a} [European] company.", tr: "Bir Avrupa şirketi." },
        ],
        note: "Harfe değil sese bak: {an} [hour] (h okunmaz), {a} [university] ('yu' diye başlar).",
      },
      {
        title: "the: bildiğimiz o",
        body: "Konuşan da dinleyen de hangisi olduğunu biliyorsa {the}: daha önce söz edildiyse, dünyada tek taneyse ya da durumdan belliyse. Türkçede karşılığı yok; 'Köpek siyah' derken hangi köpek olduğunu ikimiz de biliriz. İngilizcede bu bilgi {the} ile söylenir: {The} [dog] is black.",
        examples: [
          { en: "I've got {a} [dog] and {a} [cat]. {The} [dog] is black.", tr: "Bir köpeğim ve bir kedim var. Köpek siyah." },
          { en: "{The} [sun] is very hot today.", tr: "Güneş bugün çok yakıcı." },
          { en: "Close {the} [window], please.", tr: "Pencereyi kapat lütfen." },
          { en: "Where's {the} [bathroom]?", tr: "Banyo nerede?" },
        ],
      },
      {
        title: "Hiçbiri",
        body: "Genel konuşurken çoğul isimlerin ve sayılamayan isimlerin (su, kahve gibi tek tek sayılmayanlar) önüne artikel, yani a / an / the, gelmez: I love [dogs]. / [Coffee] is expensive. Öğünler, diller, sporlar ve çoğu ülke ile şehir de artikelsizdir.",
        table: {
          head: ["Artikel yok", "Örnek"],
          rows: [
            ["genel çoğul", "[Cats] are clever."],
            ["sayılamayan", "I need [water]."],
            ["öğün, dil, spor", "have [lunch] · learn [French] · play [tennis]"],
            ["çoğu ülke, şehir", "in [Spain] · in [İzmir]"],
            ["bazı kalıplar", "go to [work] · go to [bed] · at [home]"],
          ],
        },
        note: "İstisna ülkeler: {the} [USA], {the} [UK], {the} [Netherlands]. Adında states, kingdom ya da çoğul varsa the alır.",
      },
      {
        title: "Karşılaştır",
        table: {
          head: ["Cümle", "Anlamı"],
          rows: [
            ["I want {a} [coffee].", "(herhangi) bir kahve"],
            ["I want {the} [coffee] on the table.", "(o) masadaki kahve"],
            ["I like [coffee].", "genel olarak kahve"],
          ],
        },
      },
    ],
    mistakes: [
      { wrong: "She is ~~teacher~~.", right: "She is {a} [teacher].", why: "Meslekten önce a / an." },
      { wrong: "I play ~~the football~~.", right: "I play [football].", why: "Sporlarda artikel yok." },
      { wrong: "~~The life~~ is short.", right: "[Life] is short.", why: "Genel anlamda sayılamayan isim: artikelsiz." },
      { wrong: "The lesson is ~~a hour~~ long.", right: "The lesson is {an} [hour] long.", why: "h okunmaz, ses sesliyle başlar: an." },
      { wrong: "~~Sun~~ is hot.", right: "{The} [sun] is hot.", why: "Dünyada tek olan şey: the." },
    ],
    tip: "Kendine sor: 'Hangisi?' diye sorulsa cevap belli mi? Belliyse {the}. Belli değil ve tekse {a / an}. Genel konuşuyorsan hiçbiri.",
    quiz: [
      { kind: "choice", prompt: "I've got ___ idea!", tr: "Aklıma bir fikir geldi!", options: ["a", "an", "the"], answer: 1, explain: "idea sesliyle başlıyor: **an**." },
      { kind: "choice", prompt: "Turn off ___ light, please.", tr: "Işığı kapat lütfen.", options: ["a", "the", "—"], answer: 1, explain: "Hangi ışık olduğu belli: **the**." },
      { kind: "choice", prompt: "___ life is beautiful.", tr: "Hayat güzel.", options: ["The", "A", "—"], answer: 2, explain: "Genel anlamda sayılamayan: artikel **yok** → Life is beautiful." },
      { kind: "choice", prompt: "She studies at ___ university in Ankara.", tr: "Ankara'da bir üniversitede okuyor.", options: ["a", "an", "—"], answer: 0, explain: "'yu' sesiyle başlıyor: **a** university." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I love coffee.", "She plays the tennis.", "Close the door, please."], answer: 1, explain: "Sporlarda artikel yok: She plays **tennis**." },
      { kind: "type", prompt: "My uncle lives in ___ USA.", tr: "Amcam ABD'de yaşıyor.", answer: ["the"], explain: "the USA: istisna ülke." },
      { kind: "type", prompt: "I've got a shirt and a hat. ___ shirt is blue.", tr: "Bir gömleğim ve bir şapkam var. Gömlek mavi.", answer: ["The"], explain: "Daha önce söz edildi: **The** shirt." },
      { kind: "order", tr: "Bahçede bir köpek var.", answer: "There is a dog in the garden.", extra: ["an", "one"], explain: "İlk kez söz edilen bir köpek: **a** dog; bildiğimiz bahçe: **the** garden." },
      { kind: "order", tr: "Dünya güneşin etrafında döner.", answer: "The earth goes around the sun.", extra: ["a", "an"], explain: "Tek olan şeyler: **the** earth, **the** sun." },
      { kind: "type", prompt: "Look at ___ moon tonight!", tr: "Bu gece aya bak!", answer: ["the"], explain: "Tek olan şey: **the** moon." },
    ],
  },

  "countable-uncountable": {
    intro: "Elmayı sayarsın, suyu sayamazsın. İngilizcede bu fark çok şeyi belirler: a / an, çoğul -s, many / much hep buna bakar.",
    glance: {
      idea: "İsimler ikiye ayrılır: [elma] gibi sayılabilenler a / an ve çoğulda -s alır; <su> gibi sayılamayanlar almaz, onları {bir bardak} gibi bir ölçüyle sayarsın.",
      formulas: [
        {
          label: "Sayılabilen",
          parts: [
            { text: "I've got", role: "plain" },
            { text: "two", role: "plain", name: "sayı" },
            { text: "apples.", role: "partner", name: "isim + -s" },
          ],
        },
        {
          label: "Sayılamayan",
          parts: [
            { text: "I drink", role: "plain" },
            { text: "milk", role: "extra", name: "a yok, -s yok" },
            { text: "every day.", role: "plain" },
          ],
        },
        {
          label: "Ölçüyle",
          parts: [
            { text: "I drink", role: "plain" },
            { text: "a glass of", role: "focus", name: "ölçü + of" },
            { text: "milk.", role: "extra", name: "sayılamayan" },
          ],
        },
      ],
      compare: [
        { tr: "İki [elma] istiyorum.", en: "I want two [apples]." },
        { tr: "{Bir} <bilgi> lazım.", en: "I need {a piece of} <information>." },
        { tr: "<Haberler> çok kötü.", en: "The <news> is very bad." },
      ],
      compareNote: "Türkçe sayıdan sonra -ler eklemez, İngilizce -s ekler. Bilgi, haber gibi bazı kelimeler ise İngilizcede hiç sayılmaz ve hep tekil kalır.",
    },
    legend: { partner: "sayılabilen", extra: "sayılamayan", focus: "ölçü" },
    sections: [
      {
        title: "Sayılabilen",
        body: "Tek tek sayabildiğin şeyler: [an apple], [two apples], [a chair], [three chairs]. Tekilde a / an alır, çoğulda -s. Türkçeden farkı: sayıdan sonra da -s gelir; 'iki elma' İngilizcede [two apples] olur.",
        examples: [
          { en: "I eat [an apple] and [two bananas] every day.", tr: "Her gün bir elma ve iki muz yerim." },
          { en: "There are [four chairs] in the kitchen.", tr: "Mutfakta dört sandalye var." },
          { en: "How many [brothers] have you got?", tr: "Kaç erkek kardeşin var?" },
        ],
      },
      {
        title: "Sayılamayan",
        body: "Sıvılar, tozlar, maddeler ve elle tutulmayan (soyut) şeyler tek tek sayılmaz: <water>, <rice>, <money>, <information>, <advice>. Önlerine a / an gelmez, sonlarına -s eklenmez. Fiil hep tekil kalır: The <water> is cold.",
        table: {
          head: ["Grup", "Örnekler"],
          rows: [
            ["sıvılar", "<water> · <milk> · <coffee> · <tea>"],
            ["yiyecek maddeleri", "<bread> · <rice> · <sugar> · <cheese>"],
            ["soyut şeyler", "<advice> · <information> · <news> · <love>"],
            ["toplu şeyler", "<furniture> · <luggage> · <money> · <homework>"],
          ],
        },
        note: "Türkçede sayılan bazı şeyler İngilizcede sayılmaz: bilgi (<information>), tavsiye (<advice>), mobilya (<furniture>), bagaj (<luggage>), haber (<news>). 'an information' ya da 'advices' denmez.",
      },
      {
        title: "Sayılamayanı saymak",
        body: "Sayılamayan bir şeyi saymak için önüne bir ölçü ya da kap koy, Türkçedeki 'bir bardak su' gibi: {a glass of} <water>, {a cup of} <tea>, {a piece of} <advice>. Çoğulda -s ölçüye gelir, maddeye değil: {two cups of} <tea>.",
        table: {
          head: ["Kalıp", "Örnek", "Türkçe"],
          rows: [
            ["{a cup of}", "<coffee>", "bir fincan kahve"],
            ["{a glass of}", "<water>", "bir bardak su"],
            ["{a bottle of}", "<milk>", "bir şişe süt"],
            ["{a slice of}", "<bread>", "bir dilim ekmek"],
            ["{a loaf of}", "<bread>", "bir somun ekmek"],
            ["{a piece of}", "<advice / information>", "bir tavsiye / bilgi"],
            ["{a kilo of}", "<rice>", "bir kilo pirinç"],
          ],
        },
      },
      {
        title: "İkisi birden",
        body: "Bazı kelimeler iki türlü de kullanılır, anlam biraz kayar: [a coffee] (bir fincan kahve) / <coffee> (kahve maddesi); [a chicken] (bir tavuk, hayvan) / <chicken> (tavuk eti); [a paper] (bir gazete) / <paper> (kâğıt).",
        examples: [
          { en: "[Two coffees], please.", tr: "İki kahve lütfen." },
          { en: "I don't drink <coffee> at night.", tr: "Geceleri kahve içmem." },
          { en: "We often have <chicken> for dinner.", tr: "Akşam yemeğinde sık sık tavuk yeriz." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I've got ~~an advice~~ for you.", right: "I've got {a piece of} <advice> for you.", why: "advice sayılamaz (ya da: some advice)." },
      { wrong: "I need ~~informations~~.", right: "I need <information>.", why: "information çoğul olmaz." },
      { wrong: "The news ~~are~~ bad.", right: "The <news> is bad.", why: "news sayılamaz ve tekildir." },
      { wrong: "I want ~~a bread~~.", right: "I want {a loaf of} <bread>.", why: "bread sayılamaz: a loaf of bread ya da some bread." },
    ],
    tip: "Şüphedeysen dene: 'İki tane … diyebilir miyim?' 'İki su' demiyorsan, 'iki bardak su' diyorsan, sayılamaz: {a glass of} <water>.",
    quiz: [
      { kind: "choice", prompt: "Hangisi sayılamaz?", options: ["advice", "idea", "suggestion"], answer: 0, explain: "**advice** sayılamaz: a piece of advice / some advice. idea ve suggestion sayılır." },
      { kind: "choice", prompt: "There's ___ water on the table.", tr: "Masada bir bardak su var.", options: ["a", "a glass of", "two"], answer: 1, explain: "Sayılamayanı saymak için: **a glass of** water." },
      { kind: "choice", prompt: "I need some ___.", tr: "Biraz bilgiye ihtiyacım var.", options: ["informations", "information", "an information"], answer: 1, explain: "information sayılamaz: çoğul ve a yok." },
      { kind: "choice", prompt: "The news ___ very good today.", tr: "Bugün haberler çok iyi.", options: ["is", "are", "be"], answer: 0, explain: "news tekil: **is**." },
      { kind: "type", prompt: "I drink a ___ of tea every morning.", tr: "Her sabah bir fincan çay içerim.", answer: ["cup"], explain: "a **cup** of tea." },
      { kind: "type", prompt: "I have a ___ of bread for breakfast.", tr: "Kahvaltıda bir dilim ekmek yerim.", answer: ["slice", "piece"], explain: "a **slice** of bread (a piece of bread da olur)." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I need some information.", "I've got two advices for you.", "Our furniture is new."], answer: 1, explain: "advice çoğul olmaz: two **pieces of advice**." },
      { kind: "order", tr: "Bir şişe süt ve iki elma istiyorum.", answer: "I want a bottle of milk and two apples.", extra: ["milks", "apple"], explain: "Süt sayılamaz (a bottle of), elma sayılır (two apples)." },
      { kind: "order", tr: "Çantamda hiç para yok.", answer: "There is no money in my bag.", extra: ["are", "any"], explain: "money sayılamaz, tekil: there **is**." },
      { kind: "choice", prompt: "How ___ luggage have you got?", tr: "Ne kadar bagajın var?", options: ["many", "much", "a few"], answer: 1, explain: "luggage sayılamaz: How **much**." },
    ],
  },

  "there-is-are": {
    intro: "'Masada bir kitap var', 'Şehirde çok park var', 'Hiç süt yok'. Türkçedeki var ve yok, İngilizcede there is ve there are ile söylenir.",
    glance: {
      idea: "Türkçedeki 'var' ve 'yok', İngilizcede cümlenin başına geçer: tek şey için {there is}, birden çok şey için {there are}.",
      formulas: [
        {
          label: "Olumlu",
          parts: [
            { text: "There are", role: "focus", name: "there is · are" },
            { text: "two cats", role: "partner", name: "ne var?" },
            { text: "here.", role: "extra", name: "nerede?" },
          ],
        },
        {
          label: "Olumsuz",
          parts: [
            { text: "There isn't", role: "focus", name: "isn't · aren't" },
            { text: "any milk.", role: "partner", name: "ne yok?" },
          ],
        },
        {
          label: "Soru",
          parts: [
            { text: "Is there", role: "focus", name: "Is / Are there" },
            { text: "a bank", role: "partner", name: "ne var?" },
            { text: "near here?", role: "extra", name: "nerede?" },
          ],
        },
      ],
      compare: [
        { tr: "<Masada> [bir kitap] {var}.", en: "{There is} [a book] <on the table>." },
        { tr: "<Evde> [hiç süt] {yok}.", en: "{There isn't} [any milk] <at home>." },
        { tr: "<Yakınlarda> [banka] {var mı}?", en: "{Is there} [a bank] <near here>?" },
      ],
      compareNote: "Türkçede yer başta, 'var / yok' sonda durur; İngilizcede {there is} başa geçer, yer en sona gider.",
    },
    legend: { focus: "there is · there are", partner: "ne var?", extra: "nerede?" },
    sections: [
      {
        title: "Var: there is / there are",
        body: "Bir yerde bir şeyin bulunduğunu söyler, Türkçedeki 'var' gibi. Tek bir şey ya da sayılamayan (su, para gibi tek tek sayılmayan) bir şey için {there is} (kısaca {there's}), birden çok şey için {there are}. Olumsuzu 'yok' demektir ({there isn't / aren't}); soruda is / are başa geçer: {Is there}…?",
        table: {
          head: ["", "Tekil / sayılamayan", "Çoğul"],
          rows: [
            ["Olumlu", "{There is} [a book] <on the table>.", "{There are} [two books] <on the table>."],
            ["Olumsuz", "{There isn't} [any milk].", "{There aren't} [any eggs]."],
            ["Soru", "{Is there} [a bank] <near here>?", "{Are there} [any shops] <near here>?"],
          ],
        },
      },
      {
        title: "Günlük hayatta",
        examples: [
          { en: "{There's} [a new café] <on our street>.", tr: "Sokağımızda yeni bir kafe var." },
          { en: "{There are} [thirty students] <in my class>.", tr: "Sınıfımda otuz öğrenci var." },
          { en: "{There isn't} [any sugar] <in my tea>.", tr: "Çayımda hiç şeker yok." },
          { en: "{Is there} [a pharmacy] <near here>? — Yes, there is.", tr: "Yakınlarda eczane var mı? — Evet, var." },
        ],
      },
      {
        title: "Kısa cevap",
        body: "Yes, there {is}. / No, there {isn't}. — Yes, there {are}. / No, there {aren't}. Olumlu kısa cevap kısaltılmaz: Yes, there is. (~~Yes, there's.~~)",
        note: "Listelerde ilk isme bakılır: There {is} [a sofa] and two chairs.",
      },
      {
        title: "have mi, there is mi?",
        body: "Türkçede ikisi de 'var'. Bir şeyin sahibi varsa have: I've got a car (arabam var). Bir yerde bir şeyin bulunduğunu söylüyorsan there is: {There's} [a car] <outside> (dışarıda bir araba var).",
        examples: [
          { en: "I've got two sisters.", tr: "İki kız kardeşim var. (sahiplik)" },
          { en: "{There are} [two women] <in the photo>.", tr: "Fotoğrafta iki kadın var. (bir yerde)" },
          { en: "My city has a castle. / {There's} [a castle] <in my city>.", tr: "Şehrimin bir kalesi var. / Şehrimde bir kale var." },
        ],
      },
    ],
    mistakes: [
      { wrong: "~~There is~~ two cats.", right: "{There are} [two cats].", why: "Çoğul: there are." },
      { wrong: "~~Have~~ a bank near here?", right: "{Is there} [a bank] near here?", why: "Bir yerde var mı: Is there…?" },
      { wrong: "In my city ~~has~~ many parks.", right: "{There are} many [parks] <in my city>.", why: "Bir yerdeki 'var' için there are." },
      { wrong: "Yes, ~~there's~~.", right: "Yes, there {is}.", why: "Kısa olumlu cevap kısaltılmaz." },
    ],
    tip: "'Var' duyunca iki soru sor: Sahibi mi var? → have. Bir yerde mi var? → {there is / are}. Sonra sayıya bak: bir tane → {is}, çok → {are}.",
    quiz: [
      { kind: "type", prompt: "How many students ___ there in your class?", tr: "Sınıfında kaç öğrenci var?", answer: ["are"], explain: "How many + çoğul: **are** there." },
      { kind: "choice", prompt: "___ many tourists in summer.", tr: "Yazın çok turist var.", options: ["There is", "There are", "They are"], answer: 1, explain: "Çoğul: **There are**." },
      { kind: "choice", prompt: "___ any milk in the fridge?", tr: "Buzdolabında hiç süt var mı?", options: ["Are there", "Is there", "Has it"], answer: 1, explain: "Sayılamayan: **Is there**." },
      { kind: "type", prompt: "There ___ any eggs in the fridge.", tr: "Buzdolabında hiç yumurta yok.", answer: ["aren't", "are not"], explain: "Çoğul olumsuz: there **aren't**." },
      { kind: "type", prompt: "Is there a lift in this building? — No, there ___.", tr: "Bu binada asansör var mı? — Hayır, yok.", answer: ["isn't", "is not"], explain: "Kısa cevap: No, there **isn't**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["There are two banks here.", "There is many people here.", "Is there a lift?"], answer: 1, explain: "people çoğul: There **are** many people here." },
      { kind: "choice", prompt: "There ___ a sofa and two chairs in the room.", tr: "Odada bir kanepe ve iki sandalye var.", options: ["is", "are", "has"], answer: 0, explain: "İlk isme bakılır: a sofa → **is**." },
      { kind: "order", tr: "Sokağımızda yeni bir fırın var.", answer: "There is a new bakery on our street.", extra: ["are", "has"], explain: "Tek şey: There **is**." },
      { kind: "order", tr: "Yakınlarda hiç market var mı?", answer: "Are there any supermarkets near here?", extra: ["Is", "some"], explain: "Çoğul soru: **Are** there any…?" },
      { kind: "choice", prompt: "Yes, ___.", tr: "Evet, var.", options: ["there's", "there is", "it is"], answer: 1, explain: "Olumlu kısa cevap kısaltılmaz: **there is**." },
    ],
  },

  quantifiers: {
    intro: "Ne kadar, kaç tane? some, any, many, much, a lot of, a few, a little… Hepsi miktar söyler ama her biri başka bir isimle arkadaş. Önce ismin sayılıp sayılmadığına bak.",
    glance: {
      idea: "Önce isme bak: [sayılabilen] isme {many}, {a few}; <sayılamayan> isme {much}, {a little} gelir. {some}, {any} ve {a lot of} ikisine de gider.",
      formulas: [
        {
          label: "Sayılabilen",
          parts: [
            { text: "I've got", role: "plain" },
            { text: "a few", role: "focus", name: "a few · many" },
            { text: "friends.", role: "partner", name: "sayılabilen" },
          ],
        },
        {
          label: "Sayılamayan",
          parts: [
            { text: "I've got", role: "plain" },
            { text: "a little", role: "focus", name: "a little · much" },
            { text: "money.", role: "extra", name: "sayılamayan" },
          ],
        },
        {
          label: "Soru, olumsuz",
          parts: [
            { text: "Is there", role: "plain" },
            { text: "any", role: "focus", name: "any = hiç" },
            { text: "milk?", role: "extra", name: "sayılamayan" },
          ],
        },
      ],
      compare: [
        { tr: "{Birkaç} [yumurta] var.", en: "There are {a few} [eggs]." },
        { tr: "{Biraz} <süt> var.", en: "There is {a little} <milk>." },
        { tr: "{Çok} <vaktim> yok.", en: "I haven't got {much} <time>." },
      ],
      compareNote: "a few = birkaç, a little = biraz. Ama Türkçedeki tek 'çok', İngilizcede isme göre {many}, {much} ya da {a lot of} olur.",
    },
    legend: { focus: "miktar sözü", partner: "sayılabilen", extra: "sayılamayan" },
    sections: [
      {
        title: "some / any",
        body: "{some} 'biraz, birkaç' demek; olumlu cümlede ve kibar tekliflerde gelir. {any} olumsuz cümlede 'hiç', soruda 'hiç, herhangi' demek. İkisi de hem [sayılabilen çoğul] isimle hem <sayılamayan> isimle kullanılır.",
        examples: [
          { en: "I've got {some} [friends] in Berlin.", tr: "Berlin'de birkaç arkadaşım var." },
          { en: "There's {some} <milk> in the fridge.", tr: "Buzdolabında biraz süt var." },
          { en: "I haven't got {any} <money>.", tr: "Hiç param yok." },
          { en: "Have you got {any} [questions]?", tr: "Hiç sorunuz var mı?" },
          { en: "Do you want {some} <tea>?", tr: "Biraz çay ister misin?" },
        ],
        note: "Teklif ve ricada some kalır: Do you want {some} <cake>? / {Some} <water>, please.",
      },
      {
        title: "many / much / a lot of",
        table: {
          head: ["", "Sayılabilen", "Sayılamayan"],
          rows: [
            ["çok (soru, olumsuz)", "{many} [books]", "{much} <time>"],
            ["çok (her yerde)", "{a lot of} [books]", "{a lot of} <time>"],
            ["ne kadar?", "{How many} [books]?", "{How much} <time>?"],
          ],
        },
        examples: [
          { en: "I don't have {much} <time> today.", tr: "Bugün pek vaktim yok." },
          { en: "Are there {many} [tourists] in winter?", tr: "Kışın çok turist var mı?" },
          { en: "She drinks {a lot of} <water>.", tr: "Çok su içer." },
          { en: "{How many} [languages] do you speak?", tr: "Kaç dil konuşuyorsun?" },
        ],
        note: "Olumlu cümlede much yerine a lot of daha doğal: I have {a lot of} <time>. (~~I have much time.~~)",
      },
      {
        title: "a few / a little — few / little",
        body: "{a few} + [sayılabilen]: birkaç. {a little} + <sayılamayan>: biraz. İkisi de 'az ama yeter' der. Başındaki a düşerse anlam kararır: {few} / {little} = pek az, yetmiyor.",
        table: {
          head: ["", "Sayılabilen", "Sayılamayan", "His"],
          rows: [
            ["birkaç / biraz", "{a few} [friends]", "{a little} <money>", "😊 yeter"],
            ["pek az", "{few} [friends]", "{little} <money>", "😟 az"],
          ],
        },
        examples: [
          { en: "I have {a few} [friends] here, so I'm happy.", tr: "Burada birkaç arkadaşım var, o yüzden mutluyum." },
          { en: "He has {few} [friends]; he feels lonely.", tr: "Pek az arkadaşı var; yalnız hissediyor." },
          { en: "I put {a little} <sugar> in my tea.", tr: "Çayıma biraz şeker koyarım." },
        ],
      },
      {
        title: "so / too: çok mu, fazla mı?",
        body: "{so} + sıfat (nasıl olduğunu söyleyen kelime: cold, good) 'o kadar, çok' demek ve duygu katar: It's {so} cold today! {too} + sıfat 'fazla, gereğinden çok' demek ve bir sorun bildirir: This tea is {too} hot. Miktar için: {too much} + <sayılamayan>, {too many} + [sayılabilen].",
        examples: [
          { en: "This film is {so} good!", tr: "Bu film o kadar güzel ki!" },
          { en: "This coffee is {too} hot for me.", tr: "Bu kahve benim için fazla sıcak." },
          { en: "You spend {too much} <money> on clothes.", tr: "Kıyafete fazla para harcıyorsun." },
          { en: "There are {too many} [cars] in the city centre.", tr: "Şehir merkezinde fazla araba var." },
        ],
        note: "too kötü haber verir: 'The bag is {too} big' = çanta fazla büyük, işime yaramıyor. 'very big' ise sadece büyük.",
      },
    ],
    mistakes: [
      { wrong: "I don't have ~~some~~ money.", right: "I don't have {any} <money>.", why: "Olumsuzda any." },
      { wrong: "How ~~much~~ people live here?", right: "{How many} [people] live here?", why: "people sayılabilir: many." },
      { wrong: "I have ~~much~~ friends.", right: "I have {a lot of} [friends].", why: "Sayılabilen, olumlu cümle: a lot of." },
      { wrong: "It's ~~too~~ beautiful!", right: "It's {so} beautiful!", why: "Hayranlık: so. too 'fazla' demek, sorun bildirir." },
      { wrong: "There are ~~a little~~ eggs.", right: "There are {a few} [eggs].", why: "Sayılabilen: a few." },
    ],
    tip: "Önce isme bak: [sayılabilen] mi? → {many}, {a few}, {How many}. <Sayılamayan> mı? → {much}, {a little}, {How much}. {a lot of} ve {some} / {any} ikisiyle de gider.",
    quiz: [
      { kind: "choice", prompt: "Is there ___ bread at home?", tr: "Evde hiç ekmek var mı?", options: ["some", "any", "many"], answer: 1, explain: "Soruda hiç: **any**." },
      { kind: "choice", prompt: "There's ___ milk in the fridge, so I'm going to buy some.", tr: "Buzdolabında neredeyse hiç süt yok, o yüzden biraz alacağım.", options: ["little", "a little", "a few"], answer: 0, explain: "Yetmeyecek kadar az (sayılamayan): **little**. a little 'biraz, yeter' demek." },
      { kind: "choice", prompt: "I've only got ___ money, but it's enough for a coffee.", tr: "Biraz param var ama bir kahveye yeter.", options: ["a little", "a few", "few"], answer: 0, explain: "Sayılamayan ve yeterli: **a little**." },
      { kind: "choice", prompt: "It's ___ hot for a walk. Let's stay home.", tr: "Yürüyüş için hava fazla sıcak. Evde kalalım.", options: ["so", "too", "very much"], answer: 1, explain: "Sorun var: **too** hot." },
      { kind: "type", prompt: "Have ___ cake! It's very good.", tr: "Biraz pasta al! Çok güzel.", answer: ["some"], explain: "Teklif: **some**." },
      { kind: "type", prompt: "There are too ___ cars on this road.", tr: "Bu yolda fazla araba var.", answer: ["many"], explain: "Sayılabilen, fazla: too **many**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I haven't got any money.", "How much eggs do we need?", "There are a few chairs."], answer: 1, explain: "egg sayılabilir: How **many** eggs…?" },
      { kind: "order", tr: "Buzdolabında biraz süt var.", answer: "There is some milk in the fridge.", extra: ["any", "are"], explain: "Olumlu cümle: **some**." },
      { kind: "order", tr: "Şehirde fazla araba var.", answer: "There are too many cars in the city.", extra: ["much", "lot"], explain: "Sayılabilen, fazla: **too many**." },
      { kind: "choice", prompt: "This view is ___ beautiful!", tr: "Bu manzara o kadar güzel ki!", options: ["too", "so", "much"], answer: 1, explain: "Hayranlık: **so** beautiful." },
    ],
  },

  "present-continuous": {
    intro: "Şimdiki zaman: şu an ne oluyor? 'Yemek yapıyorum', 'Yağmur yağıyor'. Türkçedeki -yor eki İngilizcede iki parça: am / is / are + fiil-ing.",
    glance: {
      idea: "Türkçedeki '-yor' İngilizcede iki parça olur: {am / is / are} + fiil{-ing}. Şu an ya da bu aralar olan şeyler için; iki parça da şart.",
      formulas: [
        {
          label: "Olumlu",
          parts: [
            { text: "She", role: "partner", name: "özne" },
            { text: "is", role: "focus", name: "am · is · are" },
            { text: "cooking", role: "focus", name: "fiil + -ing" },
            { text: "now.", role: "extra", name: "şimdi" },
          ],
        },
        {
          label: "Olumsuz",
          parts: [
            { text: "She", role: "partner", name: "özne" },
            { text: "is", role: "focus", name: "am · is · are" },
            { text: "not", role: "plain", name: "değil" },
            { text: "cooking.", role: "focus", name: "fiil + -ing" },
          ],
        },
        {
          label: "Soru",
          parts: [
            { text: "Is", role: "focus", name: "öne geçer" },
            { text: "she", role: "partner", name: "özne" },
            { text: "cooking?", role: "focus", name: "fiil + -ing" },
          ],
        },
      ],
      compare: [
        { tr: "[Ben] çalış{ıyorum}.", en: "[I] {am} work{ing}." },
        { tr: "[Çocuklar] uyu{yor}.", en: "[The kids] {are} sleep{ing}." },
        { tr: "[O] <şu an> yemek yap{ıyor}.", en: "[She] {is} cook{ing} <now>." },
      ],
      compareNote: "Türkçede tek ek olan '-yor' İngilizcede ikiye bölünür: öznenin arkasına {am / is / are}, fiilin sonuna {-ing}.",
    },
    legend: { partner: "özne", focus: "am / is / are + -ing", extra: "şimdi / bu aralar" },
    sections: [
      {
        title: "Yapı",
        body: "Türkçedeki '-yor' ikiye bölünür: önce {am / is / are}, sonra fiil + {-ing}. Hangisinin geleceğini to be'deki gibi özne (işi yapan) seçer. İki parça da şart.",
        table: {
          head: ["Özne", "be", "fiil + -ing"],
          rows: [
            ["[I]", "{am}", "{working}"],
            ["[he / she / it]", "{is}", "{working}"],
            ["[you / we / they]", "{are}", "{working}"],
          ],
        },
        examples: [
          { en: "[I]{'m cooking} dinner <now>.", tr: "Şu an akşam yemeği yapıyorum." },
          { en: "[It]{'s raining} again.", tr: "Yine yağmur yağıyor." },
          { en: "[The kids] {are playing} in the garden.", tr: "Çocuklar bahçede oynuyor." },
        ],
      },
      {
        title: "-ing nasıl eklenir?",
        table: {
          head: ["Fiil", "Kural", "Örnek"],
          rows: [
            ["çoğu fiil", "+ ing", "work → work{ing} · play → play{ing}"],
            ["sessiz + e ile biten", "e düşer", "make → mak{ing} · write → writ{ing}"],
            ["tek hece, sesli + sessiz", "son harf ikilenir", "run → run{ning} · sit → sit{ting} · swim → swim{ming}"],
            ["-ie ile biten", "ie → y", "lie → l{ying} · die → d{ying}"],
          ],
        },
      },
      {
        title: "Olumsuz ve soru",
        body: "Olumsuzda am / is / are'dan sonra not gelir: [She] {isn't working}. Soruda am / is / are öne geçer, -ing'li fiil yerinde kalır: {Are} [you] {listening}?",
        examples: [
          { en: "[She] {isn't working} <today>.", tr: "Bugün çalışmıyor." },
          { en: "{Are} [you] {listening}?", tr: "Dinliyor musun?" },
          { en: "What {are} [you] {doing}?", tr: "Ne yapıyorsun?" },
          { en: "Yes, [I] {am}. — No, [he] {isn't}.", tr: "Evet. — Hayır." },
        ],
      },
      {
        title: "Şimdi mi, her zaman mı?",
        body: "Geniş zaman alışkanlıktır; şimdiki zaman şu an ya da bu aralar olan şeydir. İpucu sözler: <now>, <right now>, <at the moment>, <today>, <this week>, Look!, Listen!",
        table: {
          head: ["Geniş zaman (hep)", "Şimdiki zaman (şu an)"],
          rows: [
            ["I work in a bank.", "I{'m working} from home <this week>."],
            ["She drinks tea.", "She{'s drinking} coffee <now>."],
            ["It rains a lot here.", "Look! It{'s raining}."],
          ],
        },
      },
      {
        title: "-ing almayan fiiller",
        body: "Duygu, düşünce ve sahiplik bildiren fiiller genelde -ing almaz: like, love, want, know, understand, need, believe, have (sahip olmak). Türkçede 'biliyorum' deriz ama İngilizcede geniş zamanla söylenir: I know.",
        examples: [
          { en: "I know the answer.", tr: "Cevabı biliyorum. (~~I'm knowing~~ değil)" },
          { en: "She wants a new phone.", tr: "Yeni bir telefon istiyor." },
          { en: "Do you understand?", tr: "Anlıyor musun?" },
        ],
        note: "have 'sahip olmak' ise -ing almaz; 'yemek, içmek, geçirmek' anlamındaysa alır: I{'m having} lunch.",
      },
    ],
    mistakes: [
      { wrong: "I ~~cooking~~ now.", right: "[I] {am cooking} now.", why: "am / is / are unutulmaz." },
      { wrong: "She ~~is work~~ today.", right: "[She] {is working} today.", why: "Fiile -ing eklenir." },
      { wrong: "I ~~am knowing~~ him.", right: "I know him.", why: "know -ing almaz." },
      { wrong: "He is ~~swiming~~.", right: "[He] {is swimming}.", why: "swim: tek hece, sesli + sessiz → m ikilenir." },
    ],
    tip: "'-yor' duyunca iki parça kur: {am / is / are} + {-ing}. 'Ne yapıyorsun?' → What {are} you {doing}? Bir parça eksikse cümle topal kalır.",
    quiz: [
      { kind: "choice", prompt: "Listen! The baby ___.", tr: "Dinle! Bebek ağlıyor.", options: ["cries", "is crying", "crying"], answer: 1, explain: "Şu an oluyor: **is crying**." },
      { kind: "choice", prompt: "What ___ you doing?", tr: "Ne yapıyorsun?", options: ["is", "are", "do"], answer: 1, explain: "you → **are** … doing." },
      { kind: "choice", prompt: "I usually drink tea, but today I ___ coffee.", tr: "Genellikle çay içerim ama bugün kahve içiyorum.", options: ["drink", "am drinking", "drinks"], answer: 1, explain: "Bugüne özel: **am drinking**." },
      { kind: "type", prompt: "[They] are ___ in the sea.", tr: "Denizde yüzüyorlar. (swim)", answer: ["swimming"], explain: "swim → **swimming** (m ikilenir)." },
      { kind: "type", prompt: "[She] is ___ an email.", tr: "Bir e-posta yazıyor. (write)", answer: ["writing"], explain: "write → **writing** (e düşer)." },
      { kind: "type", prompt: "The children ___ sleeping, so please be quiet.", tr: "Çocuklar uyuyor, lütfen sessiz ol.", answer: ["are"], explain: "children = they → **are** sleeping." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["She is reading a book.", "I am knowing the answer.", "They are playing outside."], answer: 1, explain: "know -ing almaz: I **know** the answer." },
      { kind: "order", tr: "Şu an ne yapıyorsun?", answer: "What are you doing now?", extra: ["do", "is"], explain: "Wh + **are** + you + **doing**." },
      { kind: "order", tr: "Çocuklar parkta oynuyor mu?", answer: "Are the children playing in the park?", extra: ["Is", "play"], explain: "Soru: **Are** + özne + -ing." },
      { kind: "choice", prompt: "Look! It ___.", tr: "Bak! Kar yağıyor.", options: ["snows", "is snowing", "snowing"], answer: 1, explain: "Look! → şu an: **is snowing**." },
    ],
  },

  imperatives: {
    intro: "Emir cümlesi kısa ve nettir: 'Otur!', 'Kapıyı kapat.' İngilizcede özne yok, fiil en başta, hepsi bu. Kibarlığı da 'please' halleder.",
    glance: {
      idea: "Emirde Türkçedeki gibi özne yok, fiil ek almaz; ama fiil en başa gelir: {Open} the window. Olumsuzu {Don't}, 'hadi …-elim' ise <Let's> ile başlar.",
      formulas: [
        {
          label: "Olumlu",
          parts: [
            { text: "Open", role: "focus", name: "yalın fiil" },
            { text: "the window,", role: "plain", name: "neyi?" },
            { text: "please.", role: "extra", name: "lütfen" },
          ],
        },
        {
          label: "Olumsuz",
          parts: [
            { text: "Don't", role: "focus", name: "-me · -ma" },
            { text: "open", role: "focus", name: "yalın fiil" },
            { text: "the window.", role: "plain", name: "neyi?" },
          ],
        },
        {
          label: "Öneri",
          parts: [
            { text: "Let's", role: "extra", name: "hadi …-elim" },
            { text: "open", role: "focus", name: "yalın fiil" },
            { text: "the window.", role: "plain", name: "neyi?" },
          ],
        },
      ],
      compare: [
        { tr: "<Lütfen> pencereyi {aç}.", en: "{Open} the window, <please>." },
        { tr: "Merak et{me}.", en: "{Don't} worry." },
        { tr: "Eve gid<elim>.", en: "<Let's> go home." },
      ],
      compareNote: "Türkçede fiil sonda, İngilizcede en başta; '-me' ve '-elim' ekleri de ayrı birer kelime olup başa geçer: {Don't}, <Let's>.",
    },
    legend: { focus: "fiil (emir)", extra: "please · let's" },
    sections: [
      {
        title: "Olumlu emir",
        body: "Fiilin yalın hâli (hiç ek almamış hâli: sit, open, be) kullanılır, Türkçedeki 'Otur!', 'Aç!' gibi. Bu fiil cümlenin en başına gelir; özne (işi yapan, burada you) söylenmez: {Sit} down. {Open} the window.",
        examples: [
          { en: "{Close} the door, <please>.", tr: "Kapıyı kapat lütfen." },
          { en: "{Turn} left at the bank.", tr: "Bankadan sola dön." },
          { en: "{Take} this medicine twice a day.", tr: "Bu ilacı günde iki kez al." },
          { en: "{Be} careful!", tr: "Dikkatli ol!" },
        ],
      },
      {
        title: "Olumsuz emir: Don't",
        body: "Türkçedeki '-me / -ma' eki ('Dokunma!') İngilizcede başa gelen ayrı bir kelimedir: {Don't}. Arkasından yalın fiil gelir: {Don't} touch that! {Don't} be late.",
        examples: [
          { en: "{Don't} worry.", tr: "Merak etme." },
          { en: "{Don't} forget your keys.", tr: "Anahtarlarını unutma." },
          { en: "{Don't} be late!", tr: "Geç kalma!" },
          { en: "<Please> {don't} smoke here.", tr: "Lütfen burada sigara içmeyin." },
        ],
      },
      {
        title: "Kibar olmak",
        body: "Emri yumuşatmak için başa ya da sona <please> ekle. Daha da kibarı soru gibi sormaktır: <Can you…?> / <Could you…?> ('…-ebilir misin?'). Bunları hazır kalıp olarak öğrenmen yeter.",
        table: {
          head: ["Doğrudan", "Kibar", "Daha kibar"],
          rows: [
            ["{Open} the window.", "<Please> {open} the window.", "<Could you> {open} the window?"],
            ["{Help} me.", "{Help} me, <please>.", "<Can you> {help} me?"],
          ],
        },
      },
      {
        title: "Let's: hadi …-elim",
        body: "Birlikte bir şey yapmayı önermek için <Let's> + yalın fiil: <Let's> {go}! (Gidelim!) Olumsuzu <Let's not>: <Let's not> {argue}. (Tartışmayalım.)",
        examples: [
          { en: "<Let's> {have} a break.", tr: "Hadi mola verelim." },
          { en: "<Let's> {meet} at seven.", tr: "Yedide buluşalım." },
          { en: "<Let's not> {talk} about work.", tr: "İşten konuşmayalım." },
        ],
      },
      {
        title: "Nerelerde karşına çıkar?",
        body: "Tarifler, yol tarifleri, talimatlar ve uyarılar hep emir kipindedir.",
        examples: [
          { en: "{Add} the sugar and {mix} well.", tr: "Şekeri ekle ve iyice karıştır." },
          { en: "{Go} straight on and {take} the second right.", tr: "Düz git ve ikinci sağa dön." },
          { en: "{Press} the button and {wait}.", tr: "Düğmeye bas ve bekle." },
        ],
      },
    ],
    mistakes: [
      { wrong: "~~You sit~~ down!", right: "{Sit} down!", why: "Emirde özne söylenmez." },
      { wrong: "~~Not~~ touch it!", right: "{Don't} touch it!", why: "Olumsuz emir: Don't." },
      { wrong: "~~Don't to~~ worry.", right: "{Don't} worry.", why: "Don't'tan sonra yalın fiil; to yok." },
      { wrong: "~~Let's to~~ go.", right: "<Let's> {go}.", why: "Let's'ten sonra yalın fiil." },
      { wrong: "~~Don't be worry~~.", right: "{Don't} worry.", why: "worry zaten fiil; be gerekmez." },
    ],
    tip: "Emri bir tarif gibi düşün: fiille başla, gerisini ekle. Kibarlık için başa ya da sona <please> ekle.",
    quiz: [
      { kind: "choice", prompt: "___ the window, please. It's cold.", tr: "Pencereyi kapat lütfen. Hava soğuk.", options: ["Close", "You close", "Closing"], answer: 0, explain: "Emir: fiil başta → **Close**." },
      { kind: "choice", prompt: "___ touch the oven! It's hot.", tr: "Fırına dokunma! Sıcak.", options: ["No", "Not", "Don't"], answer: 2, explain: "Olumsuz emir: **Don't**." },
      { kind: "choice", prompt: "___ go to the beach this weekend!", tr: "Bu hafta sonu sahile gidelim!", options: ["Let's", "Let's to", "We"], answer: 0, explain: "Öneri: **Let's** + yalın fiil." },
      { kind: "type", prompt: "Don't ___ late!", tr: "Geç kalma!", answer: ["be"], explain: "Don't **be** late." },
      { kind: "type", prompt: "Please ___ forget your umbrella.", tr: "Lütfen şemsiyeni unutma.", answer: ["don't", "do not"], explain: "Olumsuz emir: **don't** + fiil." },
      { kind: "choice", prompt: "Hangisi en kibar?", options: ["Give me the salt.", "Pass me the salt, please.", "Salt!"], answer: 1, explain: "please emri yumuşatır: **Pass me the salt, please.**" },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["Don't be late!", "Not touch the oven!", "Let's go home."], answer: 1, explain: "Olumsuz emir: **Don't** touch the oven!" },
      { kind: "order", tr: "İkinci sokaktan sola dön.", answer: "Turn left at the second street.", extra: ["You", "turns"], explain: "Emirde özne yok, fiil başta." },
      { kind: "order", tr: "Lütfen burada sigara içmeyin.", answer: "Please don't smoke here.", extra: ["not", "doesn't"], explain: "Please + **don't** + fiil." },
      { kind: "choice", prompt: "___ talk about the exam. I'm tired of it.", tr: "Sınavdan konuşmayalım. Bıktım.", options: ["Don't let's", "Let's not", "Let's don't"], answer: 1, explain: "Olumsuz öneri: **Let's not**." },
    ],
  },

  "linking-words": {
    intro: "Bağlaçlar cümleleri dikiş gibi birbirine bağlar: ve, ama, çünkü, bu yüzden. Kısa cümlelerden akıcı bir anlatıma geçmenin en hızlı yolu bunlar.",
    glance: {
      idea: "Bağlaç iki cümleyi birleştirir: {and} (ve), {but} (ama), {because} (çünkü), {so} (bu yüzden). because'tan sonra <sebep>, so'dan sonra <sonuç> gelir.",
      formulas: [
        {
          label: "Sebep: because",
          parts: [
            { text: "I'm at home", role: "plain", name: "sonuç" },
            { text: "because", role: "focus", name: "çünkü" },
            { text: "I'm ill.", role: "extra", name: "sebep" },
          ],
        },
        {
          label: "Sonuç: so",
          parts: [
            { text: "I'm ill,", role: "plain", name: "sebep" },
            { text: "so", role: "focus", name: "bu yüzden" },
            { text: "I'm at home.", role: "extra", name: "sonuç" },
          ],
        },
        {
          label: "Zıtlık: but",
          parts: [
            { text: "I'm ill,", role: "plain", name: "durum" },
            { text: "but", role: "focus", name: "ama" },
            { text: "I'm at work.", role: "plain", name: "beklenmeyen" },
          ],
        },
      ],
      compare: [
        { tr: "<Hasta olduğum> {için} evdeyim.", en: "I'm at home {because} <I'm ill>." },
        { tr: "Hastayım, {bu yüzden} <evdeyim>.", en: "I'm ill, {so} <I'm at home>." },
        { tr: "Hastayım {ama} işteyim.", en: "I'm ill, {but} I'm at work." },
      ],
      compareNote: "Türkçede sebep öne geçip 'için' alır, İngilizcede ise {because} ile arkaya gider; {so} ve {but} Türkçedeki gibi ortada durur.",
    },
    legend: { focus: "bağlaç", extra: "sebep / sonuç" },
    sections: [
      {
        title: "Dört temel bağlaç",
        table: {
          head: ["Bağlaç", "Görevi", "Örnek"],
          rows: [
            ["{and}", "ekleme (ve)", "I'm tired {and} hungry."],
            ["{but}", "zıtlık (ama)", "It's small {but} cheap."],
            ["{because}", "sebep (çünkü)", "I'm at home today {because} <I'm ill>."],
            ["{so}", "sonuç (bu yüzden)", "I'm ill, {so} <I'm at home today>."],
          ],
        },
      },
      {
        title: "because mu, so mu?",
        body: "İkisi aynı olayı ters yönden anlatır. {because}'tan sonra <sebep> gelir (Türkçedeki '…dığı için'); {so}'dan sonra <sonuç> gelir (Türkçedeki '…, bu yüzden').",
        examples: [
          { en: "I'm learning English {because} <I'm going to work abroad>.", tr: "Yurt dışında çalışacağım için İngilizce öğreniyorum." },
          { en: "I'm going to work abroad, {so} <I'm learning English>.", tr: "Yurt dışında çalışacağım, bu yüzden İngilizce öğreniyorum." },
          { en: "The shop is closed, {so} <we're going home>.", tr: "Dükkân kapalı, o yüzden eve dönüyoruz." },
        ],
        note: "so'dan önce genelde virgül gelir: It's late, {so} I'm going to bed.",
      },
      {
        title: "Birkaç tane daha",
        table: {
          head: ["Bağlaç", "Anlamı", "Örnek"],
          rows: [
            ["{or}", "veya, yoksa", "Tea {or} coffee?"],
            ["{also}", "ayrıca", "She speaks French. She {also} speaks Italian."],
            ["{then}", "sonra", "First wash the rice. {Then} boil it."],
            ["{and then}", "ve sonra", "I have a shower {and then} I have breakfast."],
            ["{or}", "yoksa (uyarıda)", "Hurry up, {or} we'll be late."],
            ["{because}", "çünkü (cevapta)", "Why are you happy? — {Because} it's Friday!"],
          ],
        },
      },
      {
        title: "Bir günü anlatmak",
        body: "Sıralama sözleri anlatımı düzene sokar: {First} (önce), {Then} (sonra), {After that} (ondan sonra), {Finally} (en sonunda).",
        examples: [
          { en: "{First}, I have breakfast. {Then} I take the bus.", tr: "Önce kahvaltı ederim. Sonra otobüse binerim." },
          { en: "{After that}, I buy a coffee. {Finally}, I start work.", tr: "Ardından bir kahve alırım. En sonunda işe başlarım." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I'm hungry, ~~because~~ I'm eating a sandwich.", right: "I'm hungry, {so} <I'm eating a sandwich>.", why: "Sonuç anlatıyorsan so." },
      { wrong: "~~Because~~ I'm tired, ~~so~~ I'm going to bed.", right: "I'm tired, {so} <I'm going to bed>.", why: "because ile so birlikte kullanılmaz; ikisinden birini seç." },
      { wrong: "I like tea ~~but~~ coffee.", right: "I like tea {and} coffee.", why: "Zıtlık yoksa and." },
      { wrong: "She speaks English ~~also~~ French.", right: "She speaks English {and} French.", why: "also iki kelimeyi bağlamaz; fiilden önce durur: She also speaks French." },
    ],
    tip: "Ne anlatıyorsun? Ekleme → {and}. Zıtlık → {but}. Sebep → {because}. Sonuç → {so}. Bu dördü günlük konuşmanın dikiş makinesi.",
    quiz: [
      { kind: "choice", prompt: "The hotel is nice, ___ it's very expensive.", tr: "Otel güzel ama çok pahalı.", options: ["and", "but", "because"], answer: 1, explain: "Zıtlık: **but**." },
      { kind: "choice", prompt: "I'm taking an umbrella ___ it's raining.", tr: "Yağmur yağdığı için şemsiye alıyorum.", options: ["so", "because", "but"], answer: 1, explain: "Sebep: **because**." },
      { kind: "choice", prompt: "It's late, ___ we're taking a taxi.", tr: "Saat geç, o yüzden taksiye biniyoruz.", options: ["so", "because", "or"], answer: 0, explain: "Sonuç: **so**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I'm ill, so I'm at home.", "Because I'm ill, so I'm at home.", "I'm at home because I'm ill."], answer: 1, explain: "because ile so birlikte kullanılmaz." },
      { kind: "type", prompt: "Do you want tea ___ coffee?", tr: "Çay mı istersin, yoksa kahve mi?", answer: ["or"], explain: "Seçenek: **or**." },
      { kind: "type", prompt: "Why are you happy? — ___ it's Friday!", tr: "Neden mutlusun? — Çünkü bugün cuma!", answer: ["Because"], explain: "Why? sorusunun cevabı: **Because**." },
      { kind: "choice", prompt: "Hurry up, ___ we'll be late.", tr: "Acele et, yoksa geç kalacağız.", options: ["or", "and", "but"], answer: 0, explain: "Yoksa (uyarı): **or**." },
      { kind: "order", tr: "Yorgunum, o yüzden erken yatacağım.", answer: "I'm tired, so I'm going to bed early.", extra: ["because", "but"], explain: "Sonuç: **so**." },
      { kind: "order", tr: "Mutluyum çünkü bugün doğum günüm.", answer: "I'm happy because it's my birthday.", extra: ["so", "and"], explain: "Sebep: **because**." },
      { kind: "choice", prompt: "First, cut the onions. ___ fry them.", tr: "Önce soğanları doğra. Sonra kızart.", options: ["Then", "Because", "But"], answer: 0, explain: "Sıralama: **Then**." },
    ],
  },

  future: {
    intro: "Gelecekten söz etmenin tek yolu yok: şu an verilen bir karar mı, önceden yapılmış bir plan mı, bir tahmin mi? will ve going to bu farkı taşır.",
    glance: {
      idea: "Kararı o an, konuşurken veriyorsan {will}: 'Ben yaparım!' Kararı önceden verdiysen, yani bir planın varsa {going to}: 'Yapacağım, kararım belli.'",
      formulas: [
        {
          label: "Anlık karar: will",
          parts: [
            { text: "I", role: "partner", name: "özne" },
            { text: "will", role: "focus", name: "will · 'll" },
            { text: "cook", role: "plain", name: "yalın fiil" },
            { text: "tonight.", role: "extra", name: "zaman" },
          ],
        },
        {
          label: "Plan: going to",
          parts: [
            { text: "I", role: "partner", name: "özne" },
            { text: "am", role: "focus", name: "am · is · are" },
            { text: "going to", role: "focus", name: "going to" },
            { text: "cook", role: "plain", name: "yalın fiil" },
            { text: "tonight.", role: "extra", name: "zaman" },
          ],
        },
      ],
      compare: [
        { tr: "<Bu akşam> yemeği [ben] yap{arım}.", en: "[I]{'ll} cook <tonight>." },
        { tr: "<Bu akşam> yemeği [ben] yap{acağım}.", en: "[I]{'m going to} cook <tonight>." },
      ],
      compareNote: "'-ecek' görünce hemen will deme: o an verilen karar Türkçede çoğu zaman 'yaparım' olur ve {will} ister; hazır plan 'yapacağım' olur ve {going to} ister.",
    },
    legend: { partner: "özne", focus: "will · going to", extra: "zaman" },
    sections: [
      {
        title: "will: anlık karar, söz, tahmin",
        body: "{will} + yalın fiil (hiç ek almamış fiil). O an, konuşurken verilen karar, söz, teklif ve 'bence' diye yapılan tahmin için: Türkçedeki 'Ben açarım!', 'Ararım, söz.' gibi. Kısaltması [I]{'ll}, olumsuzu {won't}.",
        examples: [
          { en: "It's cold. [I]{'ll close} the window.", tr: "Hava soğuk. Pencereyi kapatayım." },
          { en: "[I]{'ll call} you <tomorrow>, I promise.", tr: "Yarın seni ararım, söz." },
          { en: "I think [Turkey] {will win} the match.", tr: "Bence Türkiye maçı kazanır." },
          { en: "Don't worry, [I] {won't tell} anyone.", tr: "Merak etme, kimseye söylemem." },
        ],
      },
      {
        title: "going to: plan ve kanıt",
        body: "am / is / are + {going to} + yalın fiil. Kararı daha önce verdin, şimdi planını anlatıyorsun; ya da gözünün önündeki bir işarete bakıp tahmin ediyorsun (kara bulutlar → yağmur yağacak).",
        examples: [
          { en: "[We]{'re going to} visit my grandma <this weekend>.", tr: "Bu hafta sonu büyükannemi ziyaret edeceğiz." },
          { en: "[She]{'s going to} study medicine.", tr: "Tıp okuyacak." },
          { en: "Look at those clouds! [It]{'s going to} rain.", tr: "Şu bulutlara bak! Yağmur yağacak." },
        ],
      },
      {
        title: "Hangisi?",
        table: {
          head: ["", "will", "going to"],
          rows: [
            ["Karar ne zaman?", "şimdi, konuşurken", "daha önce"],
            ["Tahmin neye dayanıyor?", "fikir, his", "şu an görülen kanıt"],
            ["Örnek", "The phone's ringing. I{'ll get} it!", "I{'m going to} buy a car <next month>."],
          ],
        },
      },
      {
        title: "Olumsuz ve soru",
        table: {
          head: ["", "will", "going to"],
          rows: [
            ["Olumsuz", "I {won't} be late.", "I{'m not going to} watch it."],
            ["Soru", "{Will} you help me?", "{Are} you {going to} come?"],
            ["Kısa cevap", "Yes, I {will}. / No, I {won't}.", "Yes, I {am}. / No, I'm not."],
          ],
        },
        note: "Saati, yeri belli planlar için şimdiki zaman da kullanılır: I{'m meeting} Ali <tonight>.",
      },
      {
        title: "Zaman sözleri",
        body: "Zaman sözü Türkçede çoğu zaman başta durur, İngilizcede genelde cümlenin sonuna gelir: <tomorrow> (yarın), <tonight> (bu akşam), <next week> (gelecek hafta), <next year> (seneye), <soon> (yakında).",
        examples: [
          { en: "See you <tomorrow>! [I]{'ll bring} the book.", tr: "Yarın görüşürüz! Kitabı getiririm." },
          { en: "[They]{'re going to} move to Ankara <next year>.", tr: "Seneye Ankara'ya taşınacaklar." },
          { en: "[Prices] {will go} up again <soon>.", tr: "Fiyatlar yakında yine artacak." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I ~~will to~~ call you.", right: "[I] {will} call you.", why: "will'den sonra yalın fiil; to yok." },
      { wrong: "She ~~going to~~ travel.", right: "[She] {is going to} travel.", why: "going to'dan önce am / is / are şart." },
      { wrong: "I've got the money. I ~~will~~ buy a car next week.", right: "I've got the money. [I]{'m going to} buy a car next week.", why: "Önceden verilmiş karar: going to." },
      { wrong: "~~Will you going to~~ come?", right: "{Are} you {going to} come?", why: "İkisini birden kullanma: Will you come? ya da Are you going to come?" },
    ],
    tip: "Kendine sor: 'Bu kararı şu an mı verdim?' Evet → {will}. 'Önceden planladım mı, ya da kanıtını görüyor muyum?' Evet → {going to}.",
    quiz: [
      { kind: "choice", prompt: "The phone's ringing! I ___ get it.", tr: "Telefon çalıyor! Ben açarım.", options: ["will", "am going to", "going to"], answer: 0, explain: "Anlık karar: **will** ('ll)." },
      { kind: "choice", prompt: "We ___ visit Rome next summer. We've got the tickets.", tr: "Gelecek yaz Roma'ya gideceğiz. Biletlerimiz hazır.", options: ["will", "are going to", "go to"], answer: 1, explain: "Önceden plan: **are going to**." },
      { kind: "choice", prompt: "Look at the sky! It ___ rain.", tr: "Gökyüzüne bak! Yağmur yağacak.", options: ["will", "is going to", "going to"], answer: 1, explain: "Görülen kanıt: **is going to**." },
      { kind: "type", prompt: "I ___ tell anyone, I promise.", tr: "Kimseye söylemeyeceğim, söz.", answer: ["won't", "will not"], explain: "Olumsuz söz: **won't**." },
      { kind: "type", prompt: "My sister ___ going to study in Germany next year.", tr: "Kız kardeşim seneye Almanya'da okuyacak.", answer: ["is", "'s"], explain: "My sister = she → **is** going to." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I'll help you.", "She going to travel.", "Are you going to come?"], answer: 1, explain: "going to'dan önce be: She **is going to** travel." },
      { kind: "choice", prompt: "___ you going to come to the party?", tr: "Partiye gelecek misin?", options: ["Will", "Are", "Do"], answer: 1, explain: "going to sorusu: **Are** you going to…?" },
      { kind: "order", tr: "Bu hafta sonu büyükannemi ziyaret edeceğim.", answer: "I am going to visit my grandmother this weekend.", extra: ["will", "go"], explain: "Plan: am **going to**." },
      { kind: "order", tr: "Bence yarın hava güzel olacak.", answer: "I think the weather will be nice tomorrow.", extra: ["going", "is"], explain: "Fikre dayalı tahmin: **will**." },
      { kind: "choice", prompt: "I'm tired. I think I ___ go to bed.", tr: "Yorgunum. Sanırım yatacağım.", options: ["will", "am going", "going to"], answer: 0, explain: "Şu an verilen karar: **will**." },
    ],
  },
};
