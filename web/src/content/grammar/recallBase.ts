import type { Recall } from "./types";

/**
 * The "Hatırla" cards of the Beginner, Elementary and Pre-Intermediate topics, keyed by slug.
 * Each card uses its topic's legend, so a colour means the same thing here as on the page.
 */
export const RECALL_BASE: Record<string, Recall> = {
  // Beginner

  "to-be": {
    points: [
      "[I] → {am} · [he / she / it] → {is} · [we / you / they] → {are}",
      "Türkçedeki '-ım, -sın, -dır' eki ayrı bir kelime olur ve hiç atlanmaz.",
      "Olumsuz: am / is / are + <not> → I'm <not> · {isn't} · {aren't}",
      "Soru: öne geçir → {Is} [she] ready? · {Are} [you] OK?",
      "Kısa cevap kısaltılmaz: Yes, [I] {am}. ~~Yes, I'm.~~",
    ],
    examples: [
      { en: "[I] {am} a student.", tr: "Öğrenciyim." },
      { en: "[My parents] {are} in Ankara.", tr: "Annemle babam Ankara'da." },
      { en: "[He] {isn't} at work today.", tr: "Bugün işte değil." },
      { en: "{Are} [you] from İzmir? — Yes, [I] {am}.", tr: "İzmirli misin? — Evet." },
    ],
    trap: { wrong: "~~She tired~~ today.", right: "[She] {is} tired today." },
  },

  "possessive-s-of": {
    points: [
      "İnsan ve hayvan → {'s}: [Ali]{'s} <car> = Ali'nin arabası",
      "Sıra Türkçedeki gibi: önce [sahip], sonra <sahip olunan>.",
      "-s ile biten çoğula yalnızca {'}: [my parents]{'} <house>",
      "Eşya, yer, fikir → {of}, sıra ters döner: <the end> {of} [the film]",
      "Zaman da 's alır: [today]{'s} <news>",
    ],
    examples: [
      { en: "This is [Deniz]{'s} <phone>.", tr: "Bu [Deniz]{'in} <telefonu>." },
      { en: "[The children]{'s} <toys> are everywhere.", tr: "Çocukların oyuncakları her yerde." },
      { en: "[My parents]{'} <house> is near the sea.", tr: "Annemle babamın evi denize yakın." },
      { en: "What's <the name> {of} [this street]?", tr: "Bu sokağın adı ne?" },
    ],
    trap: { wrong: "This is ~~the car of Ali~~.", right: "This is [Ali]{'s} <car>." },
  },

  "possessive-adjectives": {
    points: [
      "[I] {my} · [you] {your} · [he] {his} · [she] {her} · [it] {its} · [we] {our} · [they] {their}",
      "Ek yok, ismin önüne gelir: {my} book = kitabım",
      "'Onun' için sahibe bak: erkek → {his}, kadın → {her}, eşya / hayvan → {its}",
      "Kesme işareti = düşen harf: it's = it is, {its} = onun · they're ≠ {their}",
      "Önüne the gelmez: {my} car, ~~the my car~~ değil.",
    ],
    examples: [
      { en: "[Can] loves {his} mother.", tr: "Can annesini çok seviyor." },
      { en: "[Elif] is talking to {her} father.", tr: "Elif babasıyla konuşuyor." },
      { en: "[The cat] is eating {its} food.", tr: "Kedi mamasını yiyor." },
      { en: "[My parents] love {their} garden.", tr: "Annemle babam bahçelerini çok seviyor." },
    ],
    trap: { wrong: "Ayşe loves ~~his~~ job.", right: "[Ayşe] loves {her} job." },
  },

  "have-got": {
    points: [
      "[I / you / we / they] → {have got} · [he / she / it] → {has got}",
      "Aile, eşya, görünüş, hastalık: 'var' dediğin her şey, sahibiyle başlar.",
      "Kısa: [I]{'ve got} · [she]{'s got} (burada 's = has)",
      "Olumsuz: {haven't got} · {hasn't got}",
      "Soru: do yok, have / has öne → {Have} [you] {got} a pen?",
    ],
    examples: [
      { en: "[I] {have got} two brothers.", tr: "İki erkek kardeşim var." },
      { en: "[She]{'s got} blue eyes.", tr: "Mavi gözleri var." },
      { en: "[We] {haven't got} a car.", tr: "Arabamız yok." },
      { en: "{Has} [your flat] {got} a balcony? — Yes, [it] {has}.", tr: "Dairenin balkonu var mı? — Evet, var." },
    ],
    trap: { wrong: "She ~~have got~~ a cat.", right: "[She] {has got} a cat." },
  },

  jobs: {
    points: [
      "Tek kişinin mesleğinden önce {a} / {an} şart: I'm {a} [nurse].",
      "Sesli harf SESİ → {an}: {an} [engineer], {an} [actor] · ötekiler → {a}",
      "Çoğulda a / an yok: They're [doctors].",
      "Sormanın yolu: What do you do?",
      "Meslek ekleri: teach{er} · act{or} · art{ist}",
    ],
    examples: [
      { en: "What do you do? — I'm {a} [nurse].", tr: "Ne iş yapıyorsun? — Hemşireyim." },
      { en: "My father is {an} [engineer].", tr: "Babam mühendis." },
      { en: "Is your sister {a} [lawyer]?", tr: "Kız kardeşin avukat mı?" },
      { en: "They're [teachers].", tr: "Onlar öğretmen." },
    ],
    trap: { wrong: "I'm ~~teacher~~.", right: "I'm {a} [teacher]." },
  },

  // Elementary

  "noun-adjective-verb": {
    points: [
      "[İsim]: kim? ne? · {Fiil}: ne yapıyor? · <Sıfat>: nasıl?",
      "Sıfat ismin önünde: a <cheap> [flat] · ya da be'den sonra: The [flat] is <cheap>.",
      "Sıfat çoğul olmaz: <big> [houses]",
      "Sonlar ipucu: -tion, -ment, -ness → [isim] · -ful, -ous, -able → <sıfat>",
      "Bazı kelimeler hem isim hem fiil: a [walk] · I {walk}",
    ],
    examples: [
      { en: "[My brother] {drinks} <strong> [coffee].", tr: "Ağabeyim sert kahve içer." },
      { en: "[We] {live} in a <small> [town].", tr: "Küçük bir kasabada yaşıyoruz." },
      { en: "The [film] is <long> but <funny>.", tr: "Film uzun ama komik." },
      { en: "Let's go for a [walk]. — We {walk} to work.", tr: "Hadi yürüyüşe çıkalım. — İşe yürüyerek gideriz." },
    ],
    trap: { wrong: "I ~~am agree~~ with you.", right: "I {agree} with you." },
  },

  "simple-present": {
    points: [
      "Alışkanlık, rutin, genel gerçek: [I] {work} <every day>.",
      "[He / she / it] → fiile {-s}: {works} · {watches} · {studies} · {has}",
      "Olumsuz: {don't} / {doesn't} + yalın fiil → [she] {doesn't} work",
      "Soru: {Do} [you] work? · {Does} [she] work? (-s does'a geçer, fiil yalın)",
      "am / is / are karışmaz: [I] {work}, ~~I am work~~ değil.",
    ],
    examples: [
      { en: "[My sister] {works} in a bank.", tr: "Kız kardeşim bir bankada çalışır." },
      { en: "[I] {drink} coffee <every morning>.", tr: "Her sabah kahve içerim." },
      { en: "[We] {don't} watch TV <in the evening>.", tr: "Akşamları televizyon izlemeyiz." },
      { en: "{Does} [your dad] cook?", tr: "Baban yemek yapar mı?" },
    ],
    trap: { wrong: "She ~~work~~ in a hospital.", right: "[She] {works} in a hospital." },
  },

  "wh-questions": {
    points: [
      "{What} ne · {Where} nerede · {When} ne zaman · {Who} kim · {Why} neden · {How} nasıl · {Whose} kimin",
      "Sıra: {soru kelimesi} + [yardımcı] + <özne> + fiil",
      "Yardımcıyı unutma: [do / does] ya da [am / is / are]",
      "{How many} kaç tane · {How much} ne kadar · {How old} kaç yaşında · {How often} ne sıklıkla",
      "{Who} özneyi soruyorsa do yok: {Who} lives here?",
    ],
    examples: [
      { en: "{Where} [do] <you> buy your bread?", tr: "Ekmeğini nereden alırsın?" },
      { en: "{What} [does] <your father> do?", tr: "Baban ne iş yapıyor?" },
      { en: "{Why} [is] <the baby> crying?", tr: "Bebek neden ağlıyor?" },
      { en: "{How many} brothers [have] <you> got?", tr: "Kaç erkek kardeşin var?" },
    ],
    trap: { wrong: "Where ~~you live~~?", right: "{Where} [do] <you> live?" },
  },

  "sentence-building": {
    points: [
      "İskelet: [özne] + {fiil} + <nesne>. Fiil sonda değil, öznenin hemen arkasında.",
      "Sonra yer, en sonda zaman: ne → nerede → ne zaman",
      "Özne şart: 'Yorgunum' → [I] {am} tired.",
      "Hava, saat, mesafe için özne [It]: [It] {is} cold.",
      "and, but, so, because ile bağla; iki tarafta da özne + fiil kalır.",
    ],
    examples: [
      { en: "[I] {study} <English> <at home> <every day>.", tr: "Her gün evde İngilizce çalışırım." },
      { en: "[She] {speaks} <three languages>.", tr: "Üç dil konuşur." },
      { en: "[It] {takes} <twenty minutes> by bus.", tr: "Otobüsle yirmi dakika sürüyor." },
      { en: "[I] {like} <tea>, but [my wife] {prefers} <coffee>.", tr: "Ben çayı severim ama karım kahveyi tercih eder." },
    ],
    trap: { wrong: "I ~~every morning coffee drink~~.", right: "[I] {drink} <coffee> <every morning>." },
  },

  "to-by-from": {
    points: [
      "{to} = -e, -a (nereye? kime?): {to} [work] · {to} [me]",
      "{from} = -den, -dan (nereden? kimden?): I'm {from} [Trabzon].",
      "{by} + araç = -le, the yok: {by} [bus] · {by} [car] · yürüyerek = on foot",
      "{by} + gün = en geç: {by} [Friday]",
      "home ile to yok: go home",
    ],
    examples: [
      { en: "I travel {from} [Ankara] {to} [İzmir] {by} [train].", tr: "Ankara'dan İzmir'e trenle giderim." },
      { en: "This email is {from} [my boss].", tr: "Bu e-posta patronumdan." },
      { en: "I work {from} [nine] {to} [six].", tr: "Dokuzdan altıya kadar çalışırım." },
      { en: "Please send the report {to} [Selin] {by} [Monday].", tr: "Raporu en geç pazartesiye Selin'e gönder lütfen." },
    ],
    trap: { wrong: "I go to work ~~with bus~~.", right: "I go {to} [work] {by} [bus]." },
  },

  numbers: {
    points: [
      "13–19 → -teen, vurgu sonda: thir{teen} · 20–90 → -ty, vurgu başta: {thir}ty",
      "Yazıma dikkat: {forty} (u yok) · {fifteen}, {fifty} (v yok)",
      "[45] = {forty-five} (tire) · [245] = two hundred **and** forty-five",
      "Sayıdan sonra hundred / thousand çoğul olmaz: two {hundred} people",
      "Telefonda 0 = oh, aynı iki rakam = double: [55] = double {five}",
    ],
    examples: [
      { en: "How much is it? — It's {fifteen} pounds.", tr: "Ne kadar? — On beş sterlin." },
      { en: "I'm {thirty-four}.", tr: "Otuz dört yaşındayım." },
      { en: "There are {twenty-one} people in my class.", tr: "Sınıfımda yirmi bir kişi var." },
      { en: "[1,500] — one {thousand} five {hundred}", tr: "bin beş yüz" },
    ],
    trap: { wrong: "two ~~hundreds~~ people", right: "two {hundred} people" },
  },

  "ordinals-frequency": {
    points: [
      "İlk üçü düzensiz: {first}, {second}, {third} · gerisi -th: {fourth}, {fifth}, {twelfth}",
      "Tarih ve kat sıra sayısıyla: the {fifth} of May · the {third} floor",
      "{always} %100 · {usually} · {often} · {sometimes} · {never} %0",
      "Yeri: asıl fiilin önü → I {usually} [walk] · be'nin arkası → She [is] {never} late.",
      "Kaç kez: {once} · {twice} · {three times} + <a day / a week>",
    ],
    examples: [
      { en: "We live on the {third} floor.", tr: "Üçüncü katta oturuyoruz." },
      { en: "I {usually} [walk] to work.", tr: "Genellikle işe yürüyerek giderim." },
      { en: "He [is] {never} late.", tr: "Asla geç kalmaz." },
      { en: "I [go] to the gym {twice} <a week>.", tr: "Haftada iki kez spora giderim." },
    ],
    trap: { wrong: "I ~~go always~~ to the gym.", right: "I {always} [go] to the gym." },
  },

  // Pre-intermediate

  "likes-dislikes": {
    points: [
      "Merdiven: {love} › {like} › {don't mind} › {don't like} › {hate}",
      "Arkasından <isim> ya da <fiil + -ing>: I {hate} <getting up> early.",
      "{don't mind}'dan sonra hep <-ing>: I {don't mind} <waiting>.",
      "[He / she / it] → {likes} · {doesn't like}",
    ],
    examples: [
      { en: "[I] {love} <cooking> for my friends.", tr: "Arkadaşlarıma yemek yapmayı çok severim." },
      { en: "[She] {doesn't like} <horror films>.", tr: "Korku filmlerini sevmez." },
      { en: "What do [you] {like} <doing> at the weekend?", tr: "Hafta sonu ne yapmayı seversin?" },
      { en: "Do [you] {like} <jazz>? — Yes, I love it!", tr: "Caz sever misin? — Evet, bayılırım!" },
    ],
    trap: { wrong: "I like ~~very much coffee~~.", right: "[I] {like} <coffee> very much." },
  },

  articles: {
    points: [
      "{a} / {an} = herhangi bir: tek, sayılabilen, ilk kez söylenen → {a} [dog]",
      "Harfe değil sese bak: {an} [apple] · {an} [hour] · {a} [university]",
      "{the} = ikimizin de bildiği o: daha önce geçen, tek olan, belli olan",
      "Genel konuşurken artikel yok: I love [dogs]. [Coffee] is expensive.",
      "Spor, öğün, dil ve çoğu ülke artikelsiz: play [football] · in [Spain]",
    ],
    examples: [
      { en: "I've got {a} [dog] and {a} [cat]. {The} [dog] is black.", tr: "Bir köpeğim ve bir kedim var. Köpek siyah." },
      { en: "She's {an} [engineer].", tr: "Mühendis." },
      { en: "{The} [sun] is very hot today.", tr: "Güneş bugün çok yakıcı." },
      { en: "[Cats] are clever.", tr: "Kediler zekidir." },
    ],
    trap: { wrong: "Close ~~window~~, please.", right: "Close {the} [window], please." },
  },

  "countable-uncountable": {
    points: [
      "[Sayılabilen]: tekilde a / an, çoğulda -s → [an apple], [two apples]",
      "<Sayılamayan>: a / an yok, -s yok, fiil tekil → The <water> is cold.",
      "Türkçede sayılır ama burada sayılmaz: <information>, <advice>, <news>, <furniture>, <luggage>",
      "Saymak için ölçü ekle: {a glass of} <water> · {a piece of} <advice>",
      "Bazıları ikisi de: [a coffee] (bir fincan) · <coffee> (kahve maddesi)",
    ],
    examples: [
      { en: "There are [four chairs] in the kitchen.", tr: "Mutfakta dört sandalye var." },
      { en: "I buy {a loaf of} <bread> every day.", tr: "Her gün bir somun ekmek alırım." },
      { en: "The <news> is good today.", tr: "Bugün haberler iyi." },
      { en: "[Two coffees], please.", tr: "İki kahve, lütfen." },
    ],
    trap: { wrong: "I need ~~informations~~.", right: "I need <information>." },
  },

  "there-is-are": {
    points: [
      "Tek ya da sayılamayan → {there is} ({there's}) · çoğul → {there are}",
      "Olumsuz: {there isn't} · {there aren't}, genelde any ile",
      "Soru: {Is there}…? · {Are there}…? — Yes, there {is}. (Yes, there's. olmaz)",
      "'Var' iki türlü: sahibi varsa have got, bir yerde varsa {there is / are}",
      "Listede ilk isme bak: {There is} [a sofa] and two chairs.",
    ],
    examples: [
      { en: "{There's} [a new café] <on our street>.", tr: "Sokağımızda yeni bir kafe var." },
      { en: "{There are} [thirty students] <in my class>.", tr: "Sınıfımda otuz öğrenci var." },
      { en: "{There isn't} [any sugar] <in my tea>.", tr: "Çayımda hiç şeker yok." },
      { en: "{Is there} [a pharmacy] <near here>? — Yes, there {is}.", tr: "Yakınlarda eczane var mı? — Evet, var." },
    ],
    trap: { wrong: "In my city ~~has~~ many parks.", right: "{There are} many [parks] <in my city>." },
  },

  quantifiers: {
    points: [
      "Önce isme bak: [sayılabilen] mi, <sayılamayan> mı?",
      "{some}: olumlu cümle ve teklif · {any}: olumsuz ve soru (hiç)",
      "[Sayılabilen] → {many} · {a few} · {How many} / <sayılamayan> → {much} · {a little} · {How much}",
      "{a lot of} ikisiyle de gider; olumlu cümlede much yerine bunu kullan.",
      "{so} = o kadar (hayranlık) · {too} = fazla, bir sorun var → {too many} [cars]",
    ],
    examples: [
      { en: "There's {some} <milk> in the fridge.", tr: "Buzdolabında biraz süt var." },
      { en: "Have you got {any} [questions]?", tr: "Hiç sorunuz var mı?" },
      { en: "I've got {a few} [friends] here, so I'm happy.", tr: "Burada birkaç arkadaşım var, o yüzden mutluyum." },
      { en: "There are {too many} [cars] in the city centre.", tr: "Şehir merkezinde fazla araba var." },
    ],
    trap: { wrong: "I haven't got ~~some~~ money.", right: "I haven't got {any} <money>." },
  },

  "present-continuous": {
    points: [
      "Türkçedeki -yor iki parça: am / is / are + fiil-ing → [I] {am working}",
      "Şu an ya da bu aralar: <now> · <at the moment> · <this week> · Look!",
      "-ing yazımı: make → {making} · swim → {swimming} · run → {running}",
      "Olumsuz: [she] {isn't working} · Soru: {Are} [you] {listening}?",
      "know, want, like, need -ing almaz: I know, ~~I'm knowing~~ değil.",
    ],
    examples: [
      { en: "Look! [It]{'s raining}.", tr: "Bak! Yağmur yağıyor." },
      { en: "[The kids] {are playing} in the garden.", tr: "Çocuklar bahçede oynuyor." },
      { en: "[She] {isn't working} <today>.", tr: "Bugün çalışmıyor." },
      { en: "What {are} [you] {doing}?", tr: "Ne yapıyorsun?" },
    ],
    trap: { wrong: "I ~~cooking~~ now.", right: "[I] {am cooking} <now>." },
  },

  imperatives: {
    points: [
      "Özne yok, yalın fiil başta: {Sit} down. {Open} the window.",
      "Olumsuz: {Don't} + yalın fiil → {Don't} touch it!",
      "Sıfatla be gelir, fiille gelmez: {Don't} be late! · {Don't} worry.",
      "Kibarlık için başa ya da sona <please>.",
      "Hadi …-elim: <Let's> + yalın fiil → <Let's> {go}!",
    ],
    examples: [
      { en: "{Close} the door, <please>.", tr: "Kapıyı kapat lütfen." },
      { en: "{Don't} forget your keys.", tr: "Anahtarlarını unutma." },
      { en: "<Let's> {have} a break.", tr: "Hadi mola verelim." },
      { en: "{Go} straight on and {take} the second right.", tr: "Düz git ve ikinci sağa dön." },
    ],
    trap: { wrong: "Don't ~~be~~ worry.", right: "{Don't} worry." },
  },

  "linking-words": {
    points: [
      "{and} ekleme (ve) · {but} zıtlık (ama) · {or} seçenek (ya da)",
      "{because} sebebi söyler (çünkü) · {so} sonucu söyler (bu yüzden)",
      "so'dan önce genelde virgül: It's late, {so} <we're taking a taxi>.",
      "Sıralama: {First} … {Then} … {After that} … {Finally} …",
    ],
    examples: [
      { en: "The flat is small {but} cheap.", tr: "Daire küçük ama ucuz." },
      { en: "I'm staying at home {because} <it's raining>.", tr: "Evde kalıyorum çünkü yağmur yağıyor." },
      { en: "It's raining, {so} <I'm staying at home>.", tr: "Yağmur yağıyor, bu yüzden evde kalıyorum." },
      { en: "{First}, I have breakfast. {Then} I take the bus.", tr: "Önce kahvaltı ederim. Sonra otobüse binerim." },
    ],
    trap: { wrong: "I'm hungry, ~~because~~ I'm making a sandwich.", right: "I'm hungry, {so} <I'm making a sandwich>." },
  },

  future: {
    points: [
      "{will} + yalın fiil: şu an verilen karar, söz, fikre dayalı tahmin",
      "am / is / are + {going to} + yalın fiil: önceden plan, gözle görülen kanıt",
      "Kendine sor: kararı şimdi mi verdim? → {will} · önceden mi? → {going to}",
      "Olumsuz: [I] {won't} · [I]{'m not going to}",
      "Soru: {Will} [you] help me? · {Are} [you] {going to} come?",
    ],
    examples: [
      { en: "The phone's ringing. [I]{'ll get} it!", tr: "Telefon çalıyor. Ben açarım!" },
      { en: "[We]{'re going to} visit my grandma <this weekend>.", tr: "Bu hafta sonu büyükannemi ziyaret edeceğiz." },
      { en: "Look at those clouds! [It]{'s going to} rain.", tr: "Şu bulutlara bak! Yağmur yağacak." },
      { en: "Don't worry, [I] {won't tell} anyone.", tr: "Merak etme, kimseye söylemem." },
    ],
    trap: { wrong: "She ~~going to~~ travel <next week>.", right: "[She] {is going to} travel <next week>." },
  },
};
