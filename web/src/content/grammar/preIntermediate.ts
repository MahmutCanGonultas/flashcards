import type { TopicBody } from "./types";

/** Pre-intermediate: likes, articles, countables, there is, quantifiers, present continuous, imperatives, linking words, the future. */
export const PRE_INTERMEDIATE: Record<string, TopicBody> = {
  "likes-dislikes": {
    intro: "'Kahveyi severim, sabah erken kalkmaktan nefret ederim.' Sevdiğini ve sevmediğini söylemek sohbetin yarısıdır. İngilizcede bunun bir merdiveni var: love, like, don't mind, don't like, hate.",
    legend: { partner: "özne", focus: "sevme fiili", extra: "-ing / isim" },
    sections: [
      {
        title: "Merdiven",
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
        body: "Bu fiillerden sonra ya bir isim gelir ya da fiilin <-ing> hâli: I {love} <coffee>. / I {hate} <getting up> early. like ve love'dan sonra to + fiil de olur: I {like} <to swim>.",
        examples: [
          { en: "[I] {love} <cooking> for my friends.", tr: "Arkadaşlarıma yemek yapmayı çok severim." },
          { en: "[She] {doesn't like} <horror films>.", tr: "Korku filmlerini sevmez." },
          { en: "[We] {don't mind} <waiting>.", tr: "Beklemek bizim için sorun değil." },
          { en: "[My dad] {can't stand} <loud music>.", tr: "Babam yüksek sesli müziğe hiç dayanamaz." },
        ],
        note: "don't mind ve can't stand'den sonra hep -ing: I {don't mind} <waiting>, ~~to wait~~ değil.",
      },
      {
        title: "Sormak ve cevaplamak",
        body: "Do you like…? Kısa cevap: Yes, I do. / No, I don't. Daha doğal cevaplar da var: 'I love it!', 'Not really.', 'It's okay.'",
        examples: [
          { en: "Do [you] {like} <jazz>? — Yes, I love it!", tr: "Caz sever misin? — Evet, bayılırım!" },
          { en: "Does [your sister] {like} <cats>? — Not really.", tr: "Kız kardeşin kedileri sever mi? — Pek değil." },
          { en: "What do [you] {like} <doing> at the weekend?", tr: "Hafta sonu ne yapmayı seversin?" },
        ],
      },
      {
        title: "would like: şu anki istek",
        body: "I {would like} = I{'d like}: 'isterim, rica ederim'. Bu bir alışkanlık değil, şu anki isteğin. Arkasından isim ya da to + fiil gelir.",
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
      { kind: "type", prompt: "[They] love ___ football on Sundays.", tr: "Pazar günleri futbol oynamaya bayılırlar. (play)", answer: ["playing", "to play"], explain: "love + **playing** (ya da to play)." },
      { kind: "type", prompt: "I can't ___ people who talk in the cinema.", tr: "Sinemada konuşan insanlara hiç dayanamam.", answer: ["stand"], explain: "Hiç çekemem → can't **stand**." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["I like very much pizza.", "I like pizza very much.", "I very much pizza like."], answer: 1, explain: "very much sonda: I like pizza **very much**." },
      { kind: "order", tr: "Arkadaşlarımla sinemaya gitmeyi severim.", answer: "I like going to the cinema with my friends.", extra: ["go"], explain: "like + **going**." },
      { kind: "order", tr: "Bizimle yemeğe gelmek ister misin?", answer: "Would you like to come to dinner with us?", extra: ["coming"], explain: "would like + **to** + fiil." },
      { kind: "choice", prompt: "Do you like jazz? — Yes, I ___.", tr: "Caz sever misin? — Evet, severim.", options: ["like", "do", "am"], answer: 1, explain: "Kısa cevap: Yes, I **do**." },
    ],
  },

  articles: {
    intro: "Türkçede 'bir' var ama 'the' yok. İngilizcede neredeyse her ismin önünde bir karar verilir: a mı, an mı, the mı, hiçbiri mi? Kural az, örnek çok.",
    legend: { focus: "a · an · the", partner: "isim" },
    sections: [
      {
        title: "a / an: herhangi bir",
        body: "Tek, sayılabilen ve ilk kez söz edilen bir şey için {a} ya da {an}: I've got {a} [dog]. Sesli harf SESİYLE başlıyorsa {an}: {an} [apple], {an} [hour]. Ötekiler {a}: {a} [car], {a} [university].",
        examples: [
          { en: "There's {a} [cat] in the garden.", tr: "Bahçede bir kedi var." },
          { en: "She's {an} [engineer].", tr: "Mühendis." },
          { en: "I waited for {an} [hour].", tr: "Bir saat bekledim." },
          { en: "It's {a} [European] company.", tr: "Bir Avrupa şirketi." },
        ],
        note: "Harfe değil sese bak: {an} [hour] (h okunmaz), {a} [university] ('yu' diye başlar).",
      },
      {
        title: "the: bildiğimiz o",
        body: "Konuşan da dinleyen de hangisi olduğunu biliyorsa {the}: daha önce söz edildiyse, dünyada tek taneyse ya da durumdan belliyse.",
        examples: [
          { en: "I've got {a} [dog] and {a} [cat]. {The} [dog] is black.", tr: "Bir köpeğim ve bir kedim var. Köpek siyah." },
          { en: "{The} [sun] is very hot today.", tr: "Güneş bugün çok yakıcı." },
          { en: "Can you close {the} [window]?", tr: "Pencereyi kapatır mısın?" },
          { en: "She's {the} [best] player in the team.", tr: "Takımın en iyi oyuncusu." },
        ],
      },
      {
        title: "Hiçbiri",
        body: "Genel konuşurken çoğul ve sayılamayan isimlerin önüne artikel gelmez: I love [dogs]. / [Coffee] is expensive. Öğünler, diller, sporlar ve çoğu ülke ile şehir de artikelsizdir.",
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
            ["I want {the} [coffee] you made.", "(o) senin yaptığın kahve"],
            ["I like [coffee].", "genel olarak kahve"],
          ],
        },
      },
    ],
    mistakes: [
      { wrong: "She is ~~teacher~~.", right: "She is {a} [teacher].", why: "Meslekten önce a / an." },
      { wrong: "I play ~~the football~~.", right: "I play [football].", why: "Sporlarda artikel yok." },
      { wrong: "~~The life~~ is short.", right: "[Life] is short.", why: "Genel anlamda sayılamayan isim: artikelsiz." },
      { wrong: "I waited ~~a hour~~.", right: "I waited {an} [hour].", why: "h okunmaz, ses sesliyle başlar: an." },
      { wrong: "~~Sun~~ is hot.", right: "{The} [sun] is hot.", why: "Dünyada tek olan şey: the." },
    ],
    tip: "Kendine sor: 'Hangisi?' diye sorulsa cevap belli mi? Belliyse {the}. Belli değil ve tekse {a / an}. Genel konuşuyorsan hiçbiri.",
    quiz: [
      { kind: "choice", prompt: "I've got ___ idea!", tr: "Aklıma bir fikir geldi!", options: ["a", "an", "the"], answer: 1, explain: "idea sesliyle başlıyor: **an**." },
      { kind: "choice", prompt: "Can you turn off ___ light, please?", tr: "Işığı kapatır mısın lütfen?", options: ["a", "the", "—"], answer: 1, explain: "Hangi ışık olduğu belli: **the**." },
      { kind: "choice", prompt: "I love ___ chocolate.", tr: "Çikolatayı çok severim.", options: ["a", "the", "—"], answer: 2, explain: "Genel anlamda sayılamayan: artikel **yok**." },
      { kind: "choice", prompt: "She studies at ___ university in Ankara.", tr: "Ankara'da bir üniversitede okuyor.", options: ["a", "an", "—"], answer: 0, explain: "'yu' sesiyle başlıyor: **a** university." },
      { kind: "choice", prompt: "We play ___ basketball on Fridays.", tr: "Cuma günleri basketbol oynarız.", options: ["the", "a", "—"], answer: 2, explain: "Sporlarda artikel **yok**." },
      { kind: "type", prompt: "My uncle lives in ___ USA.", tr: "Amcam ABD'de yaşıyor.", answer: ["the"], explain: "the USA: istisna ülke." },
      { kind: "type", prompt: "I bought a shirt and a hat. ___ shirt is blue.", tr: "Bir gömlek ve bir şapka aldım. Gömlek mavi.", answer: ["The"], explain: "Daha önce söz edildi: **The** shirt." },
      { kind: "order", tr: "Bahçede bir köpek var.", answer: "There is a dog in the garden.", extra: ["an"], explain: "İlk kez söz edilen bir köpek: **a** dog; bildiğimiz bahçe: **the** garden." },
      { kind: "order", tr: "Dünya güneşin etrafında döner.", answer: "The earth goes around the sun.", extra: ["a"], explain: "Tek olan şeyler: **the** earth, **the** sun." },
      { kind: "choice", prompt: "It takes ___ hour to get there.", tr: "Oraya varmak bir saat sürüyor.", options: ["a", "an", "the"], answer: 1, explain: "h okunmaz: **an** hour." },
    ],
  },

  "countable-uncountable": {
    intro: "Elmayı sayarsın, suyu sayamazsın. İngilizcede bu fark çok şeyi belirler: a / an, çoğul -s, many / much hep buna bakar.",
    legend: { partner: "sayılabilen", extra: "sayılamayan", focus: "ölçü" },
    sections: [
      {
        title: "Sayılabilen",
        body: "Tek tek sayabildiğin şeyler: [an apple], [two apples], [a chair], [three chairs]. Tekilde a / an alır, çoğulda -s.",
        examples: [
          { en: "I ate [an apple] and [two bananas].", tr: "Bir elma ve iki muz yedim." },
          { en: "There are [four chairs] in the kitchen.", tr: "Mutfakta dört sandalye var." },
          { en: "How many [brothers] have you got?", tr: "Kaç erkek kardeşin var?" },
        ],
      },
      {
        title: "Sayılamayan",
        body: "Sıvılar, tozlar, maddeler ve soyut şeyler: <water>, <rice>, <money>, <information>, <advice>. a / an almaz, çoğul olmaz, fiil tekil kalır: The <water> is cold.",
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
        body: "Bir ölçü ya da kap ekle: {a glass of} <water>, {a cup of} <tea>, {a piece of} <advice>.",
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
          { en: "Can I have [two coffees], please?", tr: "İki kahve alabilir miyim?" },
          { en: "I don't drink <coffee> at night.", tr: "Geceleri kahve içmem." },
          { en: "We had <chicken> for dinner.", tr: "Akşam yemeğinde tavuk yedik." },
        ],
      },
    ],
    mistakes: [
      { wrong: "Can you give me ~~an advice~~?", right: "Can you give me {a piece of} <advice>?", why: "advice sayılamaz (ya da: some advice)." },
      { wrong: "I need ~~informations~~.", right: "I need <information>.", why: "information çoğul olmaz." },
      { wrong: "The news ~~are~~ bad.", right: "The <news> is bad.", why: "news sayılamaz ve tekildir." },
      { wrong: "I bought ~~a bread~~.", right: "I bought {a loaf of} <bread>.", why: "bread sayılamaz: a loaf of bread ya da some bread." },
    ],
    tip: "Şüphedeysen dene: 'İki tane … diyebilir miyim?' 'İki su' demiyorsan, 'iki bardak su' diyorsan, sayılamaz: {a glass of} <water>.",
    quiz: [
      { kind: "choice", prompt: "Hangisi sayılamaz?", options: ["apple", "rice", "chair"], answer: 1, explain: "**rice** tane tane sayılmaz." },
      { kind: "choice", prompt: "Can I have ___ water?", tr: "Bir bardak su alabilir miyim?", options: ["a", "a glass of", "two"], answer: 1, explain: "Sayılamayanı saymak için: **a glass of** water." },
      { kind: "choice", prompt: "I need some ___.", tr: "Biraz bilgiye ihtiyacım var.", options: ["informations", "information", "an information"], answer: 1, explain: "information sayılamaz: çoğul ve a yok." },
      { kind: "choice", prompt: "The news ___ very good today.", tr: "Bugün haberler çok iyi.", options: ["is", "are", "be"], answer: 0, explain: "news tekil: **is**." },
      { kind: "type", prompt: "Would you like a ___ of tea?", tr: "Bir fincan çay ister misin?", answer: ["cup"], explain: "a **cup** of tea." },
      { kind: "type", prompt: "She gave me a ___ of advice.", tr: "Bana bir tavsiye verdi.", answer: ["piece"], explain: "a **piece** of advice." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["We bought new furnitures.", "We bought new furniture.", "We bought a new furniture."], answer: 1, explain: "furniture sayılamaz." },
      { kind: "order", tr: "Bir şişe süt ve iki elma aldım.", answer: "I bought a bottle of milk and two apples.", extra: ["milks"], explain: "Süt sayılamaz (a bottle of), elma sayılır (two apples)." },
      { kind: "order", tr: "Çantamda hiç para yok.", answer: "There is no money in my bag.", extra: ["are"], explain: "money sayılamaz, tekil: there **is**." },
      { kind: "choice", prompt: "How ___ luggage have you got?", tr: "Ne kadar bagajın var?", options: ["many", "much", "a few"], answer: 1, explain: "luggage sayılamaz: How **much**." },
    ],
  },

  "there-is-are": {
    intro: "'Masada bir kitap var', 'Şehirde çok park var', 'Hiç süt yok'. Türkçedeki var ve yok, İngilizcede there is ve there are ile söylenir.",
    legend: { focus: "there is · there are", partner: "ne var?", extra: "nerede?" },
    sections: [
      {
        title: "Var: there is / there are",
        body: "Tek şey ya da sayılamayan için {there is} (kısaca {there's}), birden çok şey için {there are}.",
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
        body: "Türkçede ikisi de 'var'. Bir şeyin sahibi varsa have: I've got <a car> (arabam var). Bir yerde bir şeyin bulunduğunu söylüyorsan there is: {There's} [a car] <outside> (dışarıda bir araba var).",
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
      { kind: "choice", prompt: "___ a problem with my phone.", tr: "Telefonumda bir sorun var.", options: ["There is", "There are", "It has"], answer: 0, explain: "Tek şey: **There is**." },
      { kind: "choice", prompt: "___ many tourists in summer.", tr: "Yazın çok turist var.", options: ["There is", "There are", "They are"], answer: 1, explain: "Çoğul: **There are**." },
      { kind: "choice", prompt: "___ any milk in the fridge?", tr: "Buzdolabında hiç süt var mı?", options: ["Are there", "Is there", "Has it"], answer: 1, explain: "Sayılamayan: **Is there**." },
      { kind: "type", prompt: "There ___ any eggs left.", tr: "Hiç yumurta kalmadı.", answer: ["aren't", "are not"], explain: "Çoğul olumsuz: there **aren't**." },
      { kind: "type", prompt: "Is there a lift in this building? — No, there ___.", tr: "Bu binada asansör var mı? — Hayır, yok.", answer: ["isn't", "is not"], explain: "Kısa cevap: No, there **isn't**." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["In my town has a big park.", "There is a big park in my town.", "It is a big park in my town."], answer: 1, explain: "Bir yerdeki var: **There is**." },
      { kind: "choice", prompt: "There ___ a sofa and two chairs in the room.", tr: "Odada bir kanepe ve iki sandalye var.", options: ["is", "are", "has"], answer: 0, explain: "İlk isme bakılır: a sofa → **is**." },
      { kind: "order", tr: "Sokağımızda yeni bir fırın var.", answer: "There is a new bakery on our street.", extra: ["are"], explain: "Tek şey: There **is**." },
      { kind: "order", tr: "Yakınlarda hiç market var mı?", answer: "Are there any supermarkets near here?", extra: ["Is"], explain: "Çoğul soru: **Are** there any…?" },
      { kind: "choice", prompt: "Yes, ___.", tr: "Evet, var.", options: ["there's", "there is", "it is"], answer: 1, explain: "Olumlu kısa cevap kısaltılmaz: **there is**." },
    ],
  },

  quantifiers: {
    intro: "Ne kadar, kaç tane? some, any, many, much, a lot of, a few, a little… Hepsi miktar söyler ama her biri başka bir isimle arkadaş. Önce ismin sayılıp sayılmadığına bak.",
    legend: { focus: "miktar sözü", partner: "sayılabilen", extra: "sayılamayan" },
    sections: [
      {
        title: "some / any",
        body: "{some}: biraz, birkaç (olumlu cümle, kibar teklif). {any}: hiç (olumsuz), hiç / herhangi (soru). İkisi de hem [sayılabilen çoğul] hem <sayılamayan> ile kullanılır.",
        examples: [
          { en: "I've got {some} [friends] in Berlin.", tr: "Berlin'de birkaç arkadaşım var." },
          { en: "There's {some} <milk> in the fridge.", tr: "Buzdolabında biraz süt var." },
          { en: "I haven't got {any} <money>.", tr: "Hiç param yok." },
          { en: "Have you got {any} [questions]?", tr: "Hiç sorunuz var mı?" },
          { en: "Would you like {some} <tea>?", tr: "Biraz çay ister misin?" },
        ],
        note: "Teklif ve ricada some kalır: Would you like {some} <cake>? / Can I have {some} <water>?",
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
          { en: "Can I have {a little} <sugar>?", tr: "Biraz şeker alabilir miyim?" },
        ],
      },
      {
        title: "so / too: çok mu, fazla mı?",
        body: "{so} + sıfat: 'o kadar, çok' (duygu katar): It's {so} cold today! {too} + sıfat: 'fazla, gereğinden çok' (bir sorun var): It's {too} cold to swim. Miktarda: {too much} <sayılamayan>, {too many} [sayılabilen].",
        examples: [
          { en: "This film is {so} good!", tr: "Bu film o kadar güzel ki!" },
          { en: "This coffee is {too} hot; I can't drink it.", tr: "Bu kahve fazla sıcak; içemiyorum." },
          { en: "You spend {too much} <money> on clothes.", tr: "Kıyafete fazla para harcıyorsun." },
          { en: "There are {too many} [cars] in the city centre.", tr: "Şehir merkezinde fazla araba var." },
        ],
        note: "too kötü haber verir: 'The bag is {too} big' = çanta fazla büyük, işime yaramıyor. 'very big' ise sadece büyük.",
      },
    ],
    mistakes: [
      { wrong: "I don't have ~~some~~ money.", right: "I don't have {any} <money>.", why: "Olumsuzda any." },
      { wrong: "How ~~much~~ people came?", right: "{How many} [people] came?", why: "people sayılabilir: many." },
      { wrong: "I have ~~much~~ friends.", right: "I have {a lot of} [friends].", why: "Sayılabilen, olumlu cümle: a lot of." },
      { wrong: "It's ~~too~~ beautiful!", right: "It's {so} beautiful!", why: "Hayranlık: so. too 'fazla' demek, sorun bildirir." },
      { wrong: "There are ~~a little~~ eggs.", right: "There are {a few} [eggs].", why: "Sayılabilen: a few." },
    ],
    tip: "Önce isme bak: [sayılabilen] mi? → {many}, {a few}, {How many}. <Sayılamayan> mı? → {much}, {a little}, {How much}. {a lot of} ve {some} / {any} ikisiyle de gider.",
    quiz: [
      { kind: "choice", prompt: "Is there ___ bread left?", tr: "Hiç ekmek kaldı mı?", options: ["some", "any", "many"], answer: 1, explain: "Soruda hiç: **any**." },
      { kind: "choice", prompt: "How ___ eggs do we need?", tr: "Kaç yumurtaya ihtiyacımız var?", options: ["much", "many", "little"], answer: 1, explain: "egg sayılabilir: How **many**." },
      { kind: "choice", prompt: "I've only got ___ money, but it's enough for a coffee.", tr: "Biraz param var ama bir kahveye yeter.", options: ["a little", "a few", "few"], answer: 0, explain: "Sayılamayan ve yeterli: **a little**." },
      { kind: "choice", prompt: "It's ___ hot to go out. Let's stay home.", tr: "Dışarı çıkmak için hava fazla sıcak. Evde kalalım.", options: ["so", "too", "very much"], answer: 1, explain: "Sorun var: **too** hot." },
      { kind: "type", prompt: "Would you like ___ cake?", tr: "Biraz pasta ister misin?", answer: ["some"], explain: "Teklif: **some**." },
      { kind: "type", prompt: "I don't drink ___ coffee.", tr: "Pek kahve içmem.", answer: ["much", "a lot of"], explain: "Sayılamayan, olumsuz: **much**." },
      { kind: "choice", prompt: "She has ___ friends at work.", tr: "İşte birkaç arkadaşı var.", options: ["a few", "a little", "much"], answer: 0, explain: "Sayılabilen, birkaç: **a few**." },
      { kind: "order", tr: "Buzdolabında biraz süt var.", answer: "There is some milk in the fridge.", extra: ["any"], explain: "Olumlu cümle: **some**." },
      { kind: "order", tr: "Şehirde fazla araba var.", answer: "There are too many cars in the city.", extra: ["much"], explain: "Sayılabilen, fazla: **too many**." },
      { kind: "choice", prompt: "This view is ___ beautiful!", tr: "Bu manzara o kadar güzel ki!", options: ["too", "so", "much"], answer: 1, explain: "Hayranlık: **so** beautiful." },
    ],
  },

  "present-continuous": {
    intro: "Şimdiki zaman: şu an ne oluyor? 'Yemek yapıyorum', 'Yağmur yağıyor'. Türkçedeki -yor eki İngilizcede iki parça: am / is / are + fiil-ing.",
    legend: { partner: "özne", focus: "am / is / are + -ing", extra: "şimdi / bu aralar" },
    sections: [
      {
        title: "Yapı",
        body: "Türkçedeki '-yor' ikiye bölünür: am / is / are + fiil{-ing}. İki parça da şart.",
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
          { en: "[It]{'s raining} <again>.", tr: "Yine yağmur yağıyor." },
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
        body: "Duygu, düşünce ve sahiplik fiilleri genelde şimdiki zamanda kullanılmaz: like, love, want, know, understand, need, believe, have (sahip olmak).",
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
      { kind: "type", prompt: "[I] ___ not working today.", tr: "Bugün çalışmıyorum.", answer: ["am", "'m"], explain: "I → **am** not working." },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["I am wanting a coffee.", "I want a coffee.", "I wanting a coffee."], answer: 1, explain: "want -ing almaz: **I want**." },
      { kind: "order", tr: "Şu an akşam yemeği yapıyorum.", answer: "I am cooking dinner now.", extra: ["cook"], explain: "am + **cooking**." },
      { kind: "order", tr: "Çocuklar parkta oynuyor mu?", answer: "Are the children playing in the park?", extra: ["Is"], explain: "Soru: **Are** + özne + -ing." },
      { kind: "choice", prompt: "Look! It ___.", tr: "Bak! Kar yağıyor.", options: ["snows", "is snowing", "snowing"], answer: 1, explain: "Look! → şu an: **is snowing**." },
    ],
  },

  imperatives: {
    intro: "Emir cümlesi kısa ve nettir: 'Otur!', 'Kapıyı kapat.' İngilizcede özne yok, fiil en başta, hepsi bu. Kibarlığı da 'please' halleder.",
    legend: { focus: "fiil (emir)", extra: "please · let's" },
    sections: [
      {
        title: "Olumlu emir",
        body: "Fiilin yalın hâli cümlenin başına gelir; özne (you) söylenmez: {Sit} down. {Open} the window.",
        examples: [
          { en: "{Close} the door, <please>.", tr: "Kapıyı kapat lütfen." },
          { en: "{Turn} left at the bank.", tr: "Bankadan sola dön." },
          { en: "{Take} this medicine twice a day.", tr: "Bu ilacı günde iki kez al." },
          { en: "{Be} careful!", tr: "Dikkatli ol!" },
        ],
      },
      {
        title: "Olumsuz emir: Don't",
        body: "Başa {Don't} gelir, arkasından yalın fiil: {Don't} touch that! {Don't} be late.",
        examples: [
          { en: "{Don't} worry.", tr: "Merak etme." },
          { en: "{Don't} forget your keys.", tr: "Anahtarlarını unutma." },
          { en: "{Don't} be late!", tr: "Geç kalma!" },
          { en: "<Please> {don't} smoke here.", tr: "Lütfen burada sigara içmeyin." },
        ],
      },
      {
        title: "Kibar olmak",
        body: "Emri yumuşatmanın yolları: başa ya da sona <please> ekle, ya da soru gibi sor: <Can you…?> / <Could you…?>",
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
        body: "Birlikte yapmayı önermek için <Let's> + yalın fiil: <Let's> {go}! Olumsuzu: <Let's not> {argue}.",
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
    tip: "Emri bir tarif gibi düşün: fiille başla, gerisini ekle. Kibarlık için sona <please>, daha da kibarı <Could you…?>",
    quiz: [
      { kind: "choice", prompt: "___ the window, please. It's cold.", tr: "Pencereyi kapat lütfen. Hava soğuk.", options: ["Close", "You close", "Closing"], answer: 0, explain: "Emir: fiil başta → **Close**." },
      { kind: "choice", prompt: "___ touch the oven! It's hot.", tr: "Fırına dokunma! Sıcak.", options: ["No", "Not", "Don't"], answer: 2, explain: "Olumsuz emir: **Don't**." },
      { kind: "choice", prompt: "___ go to the beach this weekend!", tr: "Bu hafta sonu sahile gidelim!", options: ["Let's", "Let's to", "We"], answer: 0, explain: "Öneri: **Let's** + yalın fiil." },
      { kind: "type", prompt: "Don't ___ late!", tr: "Geç kalma!", answer: ["be"], explain: "Don't **be** late." },
      { kind: "type", prompt: "___ worry, everything is fine.", tr: "Merak etme, her şey yolunda.", answer: ["Don't", "Do not"], explain: "**Don't** worry." },
      { kind: "choice", prompt: "Hangisi en kibar?", options: ["Give me the salt.", "Could you pass me the salt?", "Salt!"], answer: 1, explain: "Soru biçimi en kibarı: **Could you…?**" },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["Don't to forget.", "Don't forget.", "Not forget."], answer: 1, explain: "Don't + yalın fiil: **Don't forget.**" },
      { kind: "order", tr: "İkinci sokaktan sola dön.", answer: "Turn left at the second street.", extra: ["You"], explain: "Emirde özne yok, fiil başta." },
      { kind: "order", tr: "Lütfen burada sigara içmeyin.", answer: "Please don't smoke here.", extra: ["not"], explain: "Please + **don't** + fiil." },
      { kind: "choice", prompt: "___ talk about the exam. I'm tired of it.", tr: "Sınavdan konuşmayalım. Bıktım.", options: ["Don't let's", "Let's not", "Let's don't"], answer: 1, explain: "Olumsuz öneri: **Let's not**." },
    ],
  },

  "linking-words": {
    intro: "Bağlaçlar cümleleri dikiş gibi birbirine bağlar: ve, ama, çünkü, bu yüzden. Kısa cümlelerden akıcı bir anlatıma geçmenin en hızlı yolu bunlar.",
    legend: { focus: "bağlaç", extra: "sebep / sonuç" },
    sections: [
      {
        title: "Dört temel bağlaç",
        table: {
          head: ["Bağlaç", "Görevi", "Örnek"],
          rows: [
            ["{and}", "ekleme (ve)", "I'm tired {and} hungry."],
            ["{but}", "zıtlık (ama)", "It's small {but} cheap."],
            ["{because}", "sebep (çünkü)", "I stayed home {because} <I was ill>."],
            ["{so}", "sonuç (bu yüzden)", "I was ill, {so} <I stayed home>."],
          ],
        },
      },
      {
        title: "because mu, so mu?",
        body: "İkisi aynı olayı ters yönden anlatır: {because} sebebi söyler, {so} sonucu. Türkçede '…dığı için' ve '…, bu yüzden'.",
        examples: [
          { en: "I'm learning English {because} <I want to work abroad>.", tr: "Yurt dışında çalışmak istediğim için İngilizce öğreniyorum." },
          { en: "I want to work abroad, {so} <I'm learning English>.", tr: "Yurt dışında çalışmak istiyorum, bu yüzden İngilizce öğreniyorum." },
          { en: "The shop was closed, {so} <we went home>.", tr: "Dükkân kapalıydı, o yüzden eve döndük." },
        ],
        note: "so'dan önce genelde virgül gelir: It was late, {so} we left.",
      },
      {
        title: "Birkaç tane daha",
        table: {
          head: ["Bağlaç", "Anlamı", "Örnek"],
          rows: [
            ["{or}", "veya, yoksa", "Tea {or} coffee?"],
            ["{also}", "ayrıca", "She speaks French. She {also} speaks Italian."],
            ["{then}", "sonra", "First wash the rice. {Then} boil it."],
            ["{when}", "-dığında", "Call me {when} you arrive."],
            ["{if}", "eğer", "{If} it rains, we'll stay home."],
            ["{although}", "-e rağmen", "{Although} it was cold, we swam."],
          ],
        },
      },
      {
        title: "Bir günü anlatmak",
        body: "Sıralama sözleri anlatımı düzene sokar: {First}, {Then}, {After that}, {Finally}.",
        examples: [
          { en: "{First}, I have breakfast. {Then} I take the bus.", tr: "Önce kahvaltı ederim. Sonra otobüse binerim." },
          { en: "{After that}, I buy a coffee. {Finally}, I start work.", tr: "Ardından bir kahve alırım. En sonunda işe başlarım." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I was hungry, ~~because~~ I ate a sandwich.", right: "I was hungry, {so} <I ate a sandwich>.", why: "Sonuç anlatıyorsan so." },
      { wrong: "~~Although~~ it was cold, ~~but~~ we swam.", right: "{Although} it was cold, we swam.", why: "although ile but birlikte kullanılmaz." },
      { wrong: "I like tea ~~but~~ coffee.", right: "I like tea {and} coffee.", why: "Zıtlık yoksa and." },
      { wrong: "She speaks English ~~also~~ French.", right: "She speaks English {and} French.", why: "also iki kelimeyi bağlamaz; fiilden önce durur: She also speaks French." },
    ],
    tip: "Ne anlatıyorsun? Ekleme → {and}. Zıtlık → {but}. Sebep → {because}. Sonuç → {so}. Bu dördü günlük konuşmanın dikiş makinesi.",
    quiz: [
      { kind: "choice", prompt: "I like cats ___ dogs.", tr: "Kedileri ve köpekleri severim.", options: ["and", "but", "so"], answer: 0, explain: "Ekleme: **and**." },
      { kind: "choice", prompt: "The hotel was nice, ___ it was very expensive.", tr: "Otel güzeldi ama çok pahalıydı.", options: ["and", "but", "because"], answer: 1, explain: "Zıtlık: **but**." },
      { kind: "choice", prompt: "I took an umbrella ___ it was raining.", tr: "Yağmur yağdığı için şemsiye aldım.", options: ["so", "because", "but"], answer: 1, explain: "Sebep: **because**." },
      { kind: "choice", prompt: "It was late, ___ we took a taxi.", tr: "Geç olmuştu, o yüzden taksiye bindik.", options: ["so", "because", "or"], answer: 0, explain: "Sonuç: **so**." },
      { kind: "type", prompt: "Do you want tea ___ coffee?", tr: "Çay mı istersin, kahve mi?", answer: ["or"], explain: "Seçenek: **or**." },
      { kind: "type", prompt: "Call me ___ you get home.", tr: "Eve varınca beni ara.", answer: ["when"], explain: "-dığında: **when**." },
      { kind: "choice", prompt: "___ it was cold, we went swimming.", tr: "Soğuk olmasına rağmen yüzmeye gittik.", options: ["Because", "Although", "So"], answer: 1, explain: "-e rağmen: **Although**." },
      { kind: "order", tr: "Yorgundum, o yüzden erken yattım.", answer: "I was tired, so I went to bed early.", extra: ["because"], explain: "Sonuç: **so**." },
      { kind: "order", tr: "Hastaydım çünkü yağmurda yürüdüm.", answer: "I was ill because I walked in the rain.", extra: ["so"], explain: "Sebep: **because**." },
      { kind: "choice", prompt: "First, cut the onions. ___ fry them.", tr: "Önce soğanları doğra. Sonra kızart.", options: ["Then", "Because", "Although"], answer: 0, explain: "Sıralama: **Then**." },
    ],
  },

  future: {
    intro: "Gelecekten söz etmenin tek yolu yok: şu an verilen bir karar mı, önceden yapılmış bir plan mı, bir tahmin mi? will ve going to bu farkı taşır.",
    legend: { partner: "özne", focus: "will · going to", extra: "zaman" },
    sections: [
      {
        title: "will: anlık karar, söz, tahmin",
        body: "{will} + yalın fiil. Konuşurken verilen kararlar, sözler, teklifler ve fikre dayalı tahminler için. Kısaltma [I]{'ll}, olumsuz {won't}.",
        examples: [
          { en: "It's cold. [I]{'ll close} the window.", tr: "Hava soğuk. Pencereyi kapatayım." },
          { en: "[I]{'ll call} you <tomorrow>, I promise.", tr: "Yarın seni ararım, söz." },
          { en: "I think [Turkey] {will win} the match.", tr: "Bence Türkiye maçı kazanır." },
          { en: "Don't worry, [I] {won't tell} anyone.", tr: "Merak etme, kimseye söylemem." },
        ],
      },
      {
        title: "going to: plan ve kanıt",
        body: "am / is / are + {going to} + yalın fiil. Önceden kararlaştırılmış planlar ve şu an görülen bir kanıta dayalı tahminler için.",
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
      { wrong: "I've saved the money. I ~~will~~ buy a car.", right: "I've saved the money. [I]{'m going to} buy a car.", why: "Önceden verilmiş karar: going to." },
      { wrong: "~~Will you going to~~ come?", right: "{Are} you {going to} come?", why: "İkisini birden kullanma: Will you come? ya da Are you going to come?" },
    ],
    tip: "Kendine sor: 'Bu kararı şu an mı verdim?' Evet → {will}. 'Önceden planladım mı, ya da kanıtını görüyor muyum?' Evet → {going to}.",
    quiz: [
      { kind: "choice", prompt: "The phone's ringing! I ___ get it.", tr: "Telefon çalıyor! Ben açarım.", options: ["will", "am going to", "going to"], answer: 0, explain: "Anlık karar: **will** ('ll)." },
      { kind: "choice", prompt: "We ___ visit Rome next summer. We've booked the hotel.", tr: "Gelecek yaz Roma'ya gideceğiz. Oteli ayırttık.", options: ["will", "are going to", "go to"], answer: 1, explain: "Önceden plan: **are going to**." },
      { kind: "choice", prompt: "Look at the sky! It ___ rain.", tr: "Gökyüzüne bak! Yağmur yağacak.", options: ["will", "is going to", "going to"], answer: 1, explain: "Görülen kanıt: **is going to**." },
      { kind: "type", prompt: "I ___ tell anyone, I promise.", tr: "Kimseye söylemeyeceğim, söz.", answer: ["won't", "will not"], explain: "Olumsuz söz: **won't**." },
      { kind: "type", prompt: "She is ___ to start a new job.", tr: "Yeni bir işe başlayacak.", answer: ["going"], explain: "is **going** to…" },
      { kind: "choice", prompt: "Hangisi doğru?", options: ["I will to help you.", "I will help you.", "I will helping you."], answer: 1, explain: "will + yalın fiil: **will help**." },
      { kind: "choice", prompt: "___ you going to come to the party?", tr: "Partiye gelecek misin?", options: ["Will", "Are", "Do"], answer: 1, explain: "going to sorusu: **Are** you going to…?" },
      { kind: "order", tr: "Bu hafta sonu büyükannemi ziyaret edeceğim.", answer: "I am going to visit my grandmother this weekend.", extra: ["will"], explain: "Plan: am **going to**." },
      { kind: "order", tr: "Bence yarın hava güzel olacak.", answer: "I think the weather will be nice tomorrow.", extra: ["going"], explain: "Fikre dayalı tahmin: **will**." },
      { kind: "choice", prompt: "I'm tired. I think I ___ go to bed.", tr: "Yorgunum. Sanırım yatacağım.", options: ["will", "am going", "going to"], answer: 0, explain: "Şu an verilen karar: **will**." },
    ],
  },
};
