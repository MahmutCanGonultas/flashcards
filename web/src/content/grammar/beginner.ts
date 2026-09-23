import type { TopicBody } from "./types";

/** Beginner: to be, possessives, have got, jobs. */
export const BEGINNER: Record<string, TopicBody> = {
  "to-be": {
    intro: "İngilizcede neredeyse her cümlenin bir fiili vardır. Türkçede 'Yorgunum' der geçeriz; İngilizcede o '-um' eki ayrı bir kelime olur: am, is, are. Hepsi bu kadar.",
    legend: { partner: "özne", focus: "am · is · are", extra: "not" },
    sections: [
      {
        title: "Ne işe yarar?",
        body: "To be, Türkçedeki '-(y)ım, -sın, -dır' eklerinin işini yapar: 'Öğrenciyim', 'Yorgunsun', 'Evde'. İngilizcede bu ekler ayrı bir kelimedir ve kişiye göre değişir: [I] {am}, [she] {is}, [we] {are}.",
        examples: [
          { en: "[I] {am} a student.", tr: "[Ben] öğrenci{yim}." },
          { en: "[She] {is} tired today.", tr: "[O] bugün yorgun." },
          { en: "[We] {are} at home.", tr: "Evde{yiz}." },
          { en: "[The coffee] {is} too hot.", tr: "[Kahve] çok sıcak." },
        ],
      },
      {
        title: "Kime hangisi?",
        table: {
          head: ["Özne", "To be", "Kısaltma"],
          rows: [
            ["[I]", "{am}", "I'm"],
            ["[You]", "{are}", "you're"],
            ["[He / She / It]", "{is}", "he's · she's · it's"],
            ["[We]", "{are}", "we're"],
            ["[They]", "{are}", "they're"],
          ],
          caption: "Konuşurken neredeyse hep kısaltılır: I'm, she's, they're.",
        },
        note: "Tek kişi ya da tek şey (he, she, it, Ali, the cat) → {is}. Birden çok (we, they, my friends) → {are}. [I] kendine özel: {am}.",
      },
      {
        title: "Olumsuz: not",
        body: "Olumsuz yapmak için am / is / are'dan hemen sonra <not> gelir. Konuşmada kısalır: {isn't}, {aren't}. Ama am not kısalmaz; onun yerine I'm not denir.",
        examples: [
          { en: "[I] {am} <not> hungry.", tr: "Aç değilim." },
          { en: "[He] {isn't} at work today.", tr: "Bugün işte değil." },
          { en: "[They] {aren't} ready yet.", tr: "Henüz hazır değiller." },
          { en: "[It] {isn't} my phone.", tr: "O benim telefonum değil." },
        ],
      },
      {
        title: "Soru: yer değiştir",
        body: "Soru sormak için am / is / are öne geçer: 'You are tired' → '{Are} [you] tired?'. Kısa cevapta aynı kelime kullanılır: Yes, I {am}. / No, I'm not.",
        examples: [
          { en: "{Are} [you] from İzmir?", tr: "İzmirli misin?" },
          { en: "{Is} [it] expensive?", tr: "Pahalı mı?" },
          { en: "Where {is} [the station]?", tr: "İstasyon nerede?" },
          { en: "Yes, [I] {am}. — No, [she] {isn't}.", tr: "Evet, öyleyim. — Hayır, değil." },
        ],
        note: "Olumlu kısa cevap kısaltılmaz: 'Yes, I am.' doğru, 'Yes, I'm.' yanlış.",
      },
    ],
    mistakes: [
      { wrong: "I ~~is~~ tired.", right: "[I] {am} tired.", why: "I her zaman am alır." },
      { wrong: "She ~~are~~ my sister.", right: "[She] {is} my sister.", why: "Tek kişi: is." },
      { wrong: "I ~~have~~ 25 years old.", right: "[I] {am} 25 years old.", why: "Yaş İngilizcede 'be' ile söylenir: I'm 25." },
      { wrong: "Yes, I'm.", right: "Yes, [I] {am}.", why: "Olumlu kısa cevap kısaltılmaz." },
    ],
    tip: "Türkçede '-dır' ekini atabilirsin ('Hava sıcak'), İngilizcede atamazsın: 'The weather {is} hot.' Cümlende fiil yoksa bir am / is / are eksik demektir.",
    quiz: [
      { kind: "choice", prompt: "[My brother and I] ___ at home.", tr: "Ağabeyimle ben evdeyiz.", options: ["is", "are", "am"], answer: 1, explain: "My brother and I = we → **are**." },
      { kind: "choice", prompt: "[My parents] ___ in Ankara.", tr: "Annemle babam Ankara'da.", options: ["is", "are", "am"], answer: 1, explain: "My parents = they → **are**." },
      { kind: "choice", prompt: "[The children] ___ in the garden.", tr: "Çocuklar bahçede.", options: ["is", "are", "am"], answer: 1, explain: "children çoğul (tekili child) → **are**." },
      { kind: "type", prompt: "[We] ___ late again!", tr: "Yine geç kaldık!", answer: ["are"], explain: "We → **are**." },
      { kind: "type", prompt: "[She] ___ from Spain; she's from Italy.", tr: "İspanyol değil, İtalyan.", answer: ["isn't", "is not"], explain: "Olumsuz: she **isn't**." },
      { kind: "choice", prompt: "___ [you] from Turkey?", tr: "Türkiye'den misin?", options: ["Is", "Are", "Am"], answer: 1, explain: "Soruda to be öne geçer. You → **Are**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["They're happy.", "He are tired.", "I'm at work."], answer: 1, explain: "He → **is**: He is tired." },
      { kind: "order", tr: "Ben yorgun değilim.", answer: "I am not tired.", also: ["I'm not tired."], extra: ["is", "no"], explain: "I + **am** + not + tired." },
      { kind: "order", tr: "Kız kardeşim doktor değil.", answer: "My sister is not a doctor.", also: ["My sister isn't a doctor."], extra: ["are", "an"], explain: "My sister → **is**; olumsuzda **not**; meslekten önce **a**." },
      { kind: "type", prompt: "___ [it] cold outside?", tr: "Dışarısı soğuk mu?", answer: ["Is"], explain: "It → **is**; soru olduğu için başa geçti." },
    ],
  },

  "possessive-s-of": {
    intro: "'Ali'nin arabası', 'filmin sonu': Türkçede ikisi de aynı ekle söylenir. İngilizcede iki yol var: insanlar için 's, eşyalar için of. Hangisini seçeceğini sahip söyler.",
    legend: { partner: "sahip (kimin?)", focus: "'s · of", extra: "sahip olunan" },
    sections: [
      {
        title: "'s: kimin?",
        body: "Bir şeyin kime ait olduğunu söylerken sahibin sonuna {'s} eklenir: [Ali]{'s} <car> = Ali'nin arabası. Türkçedeki '-(n)in' ekiyle aynı iş, sıra da aynı: önce sahip, sonra sahip olunan.",
        examples: [
          { en: "This is [Deniz]{'s} <phone>.", tr: "Bu [Deniz]{'in} <telefonu>." },
          { en: "[My mother]{'s} <name> is Ayşe.", tr: "[Annem]{in} <adı> Ayşe." },
          { en: "[The dog]{'s} <bowl> is empty.", tr: "[Köpeğ]{in} <kabı> boş." },
          { en: "Is this [your brother]{'s} <jacket>?", tr: "Bu [ağabeyin]{in} <ceketi> mi?" },
        ],
      },
      {
        title: "Birden çok sahip: s'",
        body: "Sahip -s ile biten bir çoğulsa yalnızca kesme işareti eklenir: [my parents]{'} house. -s ile bitmeyen çoğullar normal 's alır: [the children]{'s} toys, [people]{'s} ideas.",
        table: {
          head: ["Sahip", "Yazılışı", "Anlamı"],
          rows: [
            ["[my brother] (bir kişi)", "[my brother]{'s} room", "erkek kardeşimin odası"],
            ["[my brothers] (çok kişi)", "[my brothers]{'} room", "erkek kardeşlerimin odası"],
            ["[the children]", "[the children]{'s} books", "çocukların kitapları"],
            ["[James]", "[James]{'s} car", "James'in arabası"],
          ],
        },
        note: "Kulağa aynı gelir: brother's ve brothers' ikisi de 'bradırz' diye okunur. Farkı yazıda görürsün.",
      },
      {
        title: "of: eşyalar, yerler, fikirler",
        body: "Sahip bir insan ya da hayvan değilse (bir eşya, bir yer, bir fikir) genelde {of} kullanılır ve sıra ters döner: önce sahip olunan, sonra sahip. <the end> {of} [the film] = filmin sonu.",
        examples: [
          { en: "What's <the name> {of} [this street]?", tr: "[Bu sokağ]ın <adı> ne?" },
          { en: "I fell asleep before <the end> {of} [the film].", tr: "[Film]in <sonundan> önce uyuyakaldım." },
          { en: "Ankara is <the capital> {of} [Turkey].", tr: "Ankara [Türkiye]'nin <başkentidir>." },
          { en: "Write your name at <the top> {of} [the page].", tr: "Adını [sayfa]nın <en üstüne> yaz." },
        ],
      },
      {
        title: "Hangisi ne zaman?",
        table: {
          head: ["Sahip", "Kullan", "Örnek"],
          rows: [
            ["İnsan, hayvan", "{'s}", "[Mert]{'s} bike · [the cat]{'s} tail"],
            ["Eşya, yer, fikir", "{of}", "the end {of} [the road]"],
            ["Zaman ifadesi", "{'s}", "[today]{'s} news · [a week]{'s} holiday"],
          ],
          caption: "Kural kesin değil ama bu tablo seni hemen her zaman doğru yere götürür.",
        },
      },
    ],
    mistakes: [
      { wrong: "the car ~~of Ali~~", right: "[Ali]{'s} car", why: "Sahip bir insansa 's çok daha doğal." },
      { wrong: "my ~~parents's~~ house", right: "[my parents]{'} house", why: "-s ile biten çoğula yalnızca ' eklenir." },
      { wrong: "the ~~childrens'~~ toys", right: "[the children]{'s} toys", why: "children zaten çoğul ve -s ile bitmiyor: normal 's." },
      { wrong: "~~Ayşe car~~ is red.", right: "[Ayşe]{'s} car is red.", why: "Türkçedeki '-in' ekini unutma: sahibe 's gelir." },
    ],
    tip: "'s = Türkçedeki '-nin'. Ali'nin → [Ali]{'s}. Sıra da aynı, bu yüzden kolay. Eşyalar için 'the ___ {of} the ___' kalıbını ezberle: the end {of} the film.",
    quiz: [
      { kind: "choice", prompt: "This is ___ bag.", tr: "Bu Mert'in çantası.", options: ["Mert's", "Mert", "of Mert"], answer: 0, explain: "Sahip bir insan: **Mert's** bag." },
      { kind: "choice", prompt: "My ___ house is near the sea.", tr: "Büyükannemle büyükbabamın evi denize yakın.", options: ["grandparents'", "grandparents's", "grandparent of"], answer: 0, explain: "Çoğul ve -s ile bitiyor: yalnızca kesme → **grandparents'**." },
      { kind: "choice", prompt: "What's the name ___ this song?", tr: "Bu şarkının adı ne?", options: ["of", "'s", "from"], answer: 0, explain: "Şarkı bir şey, insan değil: the name **of** this song." },
      { kind: "type", prompt: "The ___ toys are everywhere!", tr: "Çocukların oyuncakları her yerde! (children)", answer: ["children's"], explain: "children -s ile bitmez: **children's**." },
      { kind: "type", prompt: "My ___ bedroom is bigger than mine.", tr: "Kız kardeşlerimin yatak odası benimkinden büyük. (sisters)", answer: ["sisters'"], explain: "Birden çok kız kardeş, -s ile biten çoğul: **sisters'**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["This is James's car.", "My parents's house is big.", "The children's toys are here."], answer: 1, explain: "-s ile biten çoğula yalnızca ' gelir: **my parents' house**." },
      { kind: "choice", prompt: "Did you read ___ newspaper?", tr: "Bugünün gazetesini okudun mu?", options: ["today's", "today", "of today"], answer: 0, explain: "Zaman ifadeleri 's alır: **today's** newspaper." },
      { kind: "order", tr: "Ali'nin arabası kırmızı.", answer: "Ali's car is red.", extra: ["of", "Ali"], explain: "Sahip + **'s** + sahip olunan." },
      { kind: "order", tr: "Kitabın sonu harika.", answer: "The end of the book is great.", extra: ["book's", "from"], explain: "Eşya: the end **of** the book." },
      { kind: "choice", prompt: "The ___ names are Can and Ece.", tr: "İkizlerin adları Can ve Ece.", options: ["twins'", "twin's", "twins's"], answer: 0, explain: "İki kişi, -s ile biten çoğul: **twins'**." },
    ],
  },

  "possessive-adjectives": {
    intro: "Türkçede sahiplik bir ektir: kitab-ım, kitab-ın. İngilizcede ek yok; ismin önüne küçük bir kelime gelir: my book, your book. Yedi tane, hepsi bu.",
    legend: { partner: "kişi", focus: "my · your · his · her · its · our · their" },
    sections: [
      {
        title: "Benim, senin, onun…",
        body: "Her kişinin bir sahiplik kelimesi var ve hep bir isimle birlikte gelir. Tek başına durmaz: {my} book, {our} house.",
        table: {
          head: ["Kişi", "Sahiplik", "Örnek"],
          rows: [
            ["[I]", "{my}", "{my} phone — telefonum"],
            ["[you]", "{your}", "{your} bag — çantan"],
            ["[he]", "{his}", "{his} car — (erkeğin) arabası"],
            ["[she]", "{her}", "{her} car — (kadının) arabası"],
            ["[it]", "{its}", "{its} tail — kuyruğu"],
            ["[we]", "{our}", "{our} house — evimiz"],
            ["[they]", "{their}", "{their} kids — çocukları"],
          ],
        },
      },
      {
        title: "his mi, her mi?",
        body: "Türkçede 'onun' tek kelime; İngilizcede sahibin kendisine bakılır. Sahip erkekse {his}, kadınsa {her}. Eşyanın ne olduğu önemli değil.",
        examples: [
          { en: "[Can] loves {his} mother.", tr: "Can annesini çok seviyor." },
          { en: "[Elif] is talking to {her} father.", tr: "Elif babasıyla konuşuyor." },
          { en: "[My brother] and {his} wife live in Bursa.", tr: "Ağabeyim ve karısı Bursa'da yaşıyor." },
          { en: "[The cat] is eating {its} food.", tr: "Kedi mamasını yiyor." },
        ],
        note: "Hayvan ya da eşya için {its}. Ama kendi kedini anlatırken çoğu kişi his / her der; o da doğru.",
      },
      {
        title: "its ≠ it's, their ≠ there",
        body: "{its} = onun (sahiplik). it's = it is. {their} = onların. there = orada. Kesme işareti hep bir harfin düştüğünü gösterir: it's = it is, they're = they are.",
        examples: [
          { en: "The company changed {its} name.", tr: "Şirket adını değiştirdi." },
          { en: "It's cold today.", tr: "Bugün hava soğuk. (it is)" },
          { en: "{Their} flat is small but bright.", tr: "Daireleri küçük ama aydınlık." },
          { en: "They're at work now.", tr: "Şu an işteler. (they are)" },
        ],
      },
      {
        title: "Cümlede",
        examples: [
          { en: "What's {your} name?", tr: "Adın ne?" },
          { en: "{Our} teacher is from Canada.", tr: "Öğretmenimiz Kanadalı." },
          { en: "I can't find {my} keys.", tr: "Anahtarlarımı bulamıyorum." },
          { en: "The kids are in {their} room.", tr: "Çocuklar odalarında." },
        ],
      },
    ],
    mistakes: [
      { wrong: "~~Me~~ name is Deniz.", right: "{My} name is Deniz.", why: "Sahiplik için my; me 'beni, bana' demektir." },
      { wrong: "Ayşe loves ~~his~~ job.", right: "[Ayşe] loves {her} job.", why: "Ayşe kadın: her." },
      { wrong: "The dog is eating ~~it's~~ food.", right: "The dog is eating {its} food.", why: "Sahiplik: its (kesmesiz). it's = it is." },
      { wrong: "This is ~~the my~~ car.", right: "This is {my} car.", why: "my, your, his… önünde the kullanılmaz." },
    ],
    tip: "Kesme işareti = düşen harf: it's (it is), they're (they are), you're (you are). Kesme yoksa sahiplik: {its}, {their}, {your}.",
    quiz: [
      { kind: "choice", prompt: "[My sister] and ___ husband live in İzmir.", tr: "Kız kardeşim ve kocası İzmir'de yaşıyor.", options: ["his", "her", "their"], answer: 1, explain: "Sahip kız kardeş (kadın) → **her** husband." },
      { kind: "choice", prompt: "[Selin] is with ___ friends.", tr: "Selin arkadaşlarıyla.", options: ["his", "her", "their"], answer: 1, explain: "Selin kadın → **her**." },
      { kind: "choice", prompt: "[My parents] sold ___ car.", tr: "Annemle babam arabalarını sattı.", options: ["their", "there", "they're"], answer: 0, explain: "Sahiplik: **their**." },
      { kind: "choice", prompt: "The tree lost ___ leaves.", tr: "Ağaç yapraklarını döktü.", options: ["its", "it's", "his"], answer: 0, explain: "Eşya ya da bitki: **its** (kesmesiz)." },
      { kind: "type", prompt: "[Ali and Deniz] love ___ new flat.", tr: "Ali ve Deniz yeni dairelerini çok seviyor.", answer: ["their"], explain: "Ali and Deniz = they → **their**." },
      { kind: "type", prompt: "[Mert] can't find ___ phone.", tr: "Mert telefonunu bulamıyor.", answer: ["his"], explain: "Mert erkek → **his**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["Their car is new.", "Is this you're bag?", "Its name is Duman."], answer: 1, explain: "Sahiplik: **your** bag. you're = you are." },
      { kind: "order", tr: "Onların evi çok büyük.", answer: "Their house is very big.", extra: ["There", "They're"], explain: "Sahiplik: **Their** house." },
      { kind: "order", tr: "Kedi kuyruğuyla oynuyor.", answer: "The cat is playing with its tail.", extra: ["it's", "his"], explain: "Hayvanın sahipliği: **its**." },
      { kind: "type", prompt: "Is this ___ bag, Ali?", tr: "Bu senin çantan mı, Ali?", answer: ["your"], explain: "You → **your**." },
    ],
  },

  "have-got": {
    intro: "'Arabam var', 'İki kardeşim var', 'Başım ağrıyor'. Türkçede 'var' deriz; İngilizcede 'sahibim' deriz: I have got. Aile, eşya, görünüş, hastalık, hepsi bununla söylenir.",
    legend: { partner: "özne", focus: "have got · has got", extra: "not" },
    sections: [
      {
        title: "Sahip olmak",
        body: "Bir şeyin sende olduğunu söylemek için: [I] {have got} a car. Kısaca [I]{'ve got} a car. Türkçedeki 'var' ile aynı yerde kullanılır ama cümle sahiple başlar.",
        examples: [
          { en: "[I] {have got} two brothers.", tr: "İki erkek kardeşim var." },
          { en: "[She] {has got} blue eyes.", tr: "Mavi gözleri var." },
          { en: "[We]{'ve got} a small garden.", tr: "Küçük bir bahçemiz var." },
          { en: "[He]{'s got} a headache.", tr: "Başı ağrıyor." },
        ],
      },
      {
        title: "have mi, has mı?",
        table: {
          head: ["Özne", "Olumlu", "Kısa"],
          rows: [
            ["[I / you / we / they]", "{have got}", "I{'ve got} · they{'ve got}"],
            ["[he / she / it]", "{has got}", "she{'s got} · it{'s got}"],
          ],
          caption: "he / she / it → has. Geri kalan herkes → have.",
        },
        note: "She{'s got} = She {has got}. 'She is' kısaltmasıyla aynı görünür; arkasında got varsa has'tir.",
      },
      {
        title: "Olumsuz ve soru",
        body: "Olumsuzda have / has'tan sonra <not>: {haven't got}, {hasn't got}. Soruda have / has öne geçer: {Have} [you] {got}…? Kısa cevap: Yes, I {have}. / No, I {haven't}.",
        examples: [
          { en: "[I] {haven't got} time today.", tr: "Bugün vaktim yok." },
          { en: "[She] {hasn't got} a car.", tr: "Arabası yok." },
          { en: "{Have} [you] {got} a pen?", tr: "Kalemin var mı?" },
          { en: "{Has} [your flat] {got} a balcony?", tr: "Dairenin balkonu var mı?" },
          { en: "Yes, [I] {have}. — No, [it] {hasn't}.", tr: "Evet, var. — Hayır, yok." },
        ],
      },
      {
        title: "have got ile have",
        body: "Aynı anlamda iki yol var: 'I {'ve got} a car' (İngiltere'de, konuşurken) ve 'I have a car' (her yerde). have tek başına olunca olumsuz ve soruda do / does ister.",
        table: {
          head: ["", "have got", "have"],
          rows: [
            ["Olumlu", "I{'ve got} a dog.", "I have a dog."],
            ["Olumsuz", "I {haven't got} a dog.", "I don't have a dog."],
            ["Soru", "{Have} you {got} a dog?", "Do you have a dog?"],
          ],
        },
        note: "Geçmişte got kullanılmaz: 'Bir köpeğim vardı' = I had a dog.",
      },
    ],
    mistakes: [
      { wrong: "She ~~have got~~ a cat.", right: "[She] {has got} a cat.", why: "he / she / it → has." },
      { wrong: "~~Do you have got~~ a car?", right: "{Have} [you] {got} a car?", why: "have got sorusunda do yok; have öne geçer." },
      { wrong: "I ~~don't have got~~ money.", right: "[I] {haven't got} any money.", why: "Olumsuz: haven't got (do yok)." },
      { wrong: "I ~~have~~ 30 years.", right: "[I] am 30.", why: "Yaş have ile değil be ile söylenir." },
    ],
    tip: "'Var' dediğin şeyin sahibi kimse cümleye onunla başla: 'Arabam var' → [I]{'ve got} a car. 'Başım ağrıyor' da sahiplik: [I]{'ve got} a headache.",
    quiz: [
      { kind: "choice", prompt: "[She] ___ got a new job.", tr: "Yeni bir işi var.", options: ["has", "have", "is"], answer: 0, explain: "She → **has** got." },
      { kind: "choice", prompt: "[They] ___ got three kids.", tr: "Üç çocukları var.", options: ["has", "have", "are"], answer: 1, explain: "They → **have** got." },
      { kind: "type", prompt: "___ [your brother] got a car?", tr: "Ağabeyinin arabası var mı?", answer: ["Has"], explain: "your brother = he → **Has** … got?" },
      { kind: "type", prompt: "[I] ___ got any money.", tr: "Hiç param yok.", answer: ["haven't", "have not"], explain: "Olumsuz: **haven't** got." },
      { kind: "type", prompt: "[My flat] ___ got a garden.", tr: "Dairemin bahçesi yok.", answer: ["hasn't", "has not"], explain: "My flat = it → **hasn't** got." },
      { kind: "choice", prompt: "Has he got a car? — Yes, he ___.", tr: "Arabası var mı? — Evet, var.", options: ["has", "is", "does"], answer: 0, explain: "Kısa cevap soruyla aynı: Yes, he **has**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["We've got a big garden.", "Does she have got a car?", "They haven't got time."], answer: 1, explain: "have got sorusunda does yok: **Has she got** a car?" },
      { kind: "order", tr: "Başım ağrıyor.", answer: "I have got a headache.", also: ["I've got a headache."], extra: ["has", "am"], explain: "Hastalıklar da sahiplik: I **have got** a headache." },
      { kind: "order", tr: "Kız kardeşimin uzun saçları yok.", answer: "My sister hasn't got long hair.", also: ["My sister has not got long hair."], extra: ["haven't", "don't"], explain: "My sister = she → **hasn't got**." },
      { kind: "choice", prompt: "[We] ___ a big garden when I was a child.", tr: "Ben çocukken büyük bir bahçemiz vardı.", options: ["have got", "had", "has got"], answer: 1, explain: "Geçmişte got kullanılmaz: **had**." },
    ],
  },

  jobs: {
    intro: "'Ne iş yapıyorsun?' günde bir kez sorulan bir soru. Cevabın en çok atlanan kelimesi Türkçede olmayan bir 'a': I'm a nurse. Önce onu, sonra meslekleri öğrenelim.",
    legend: { focus: "a · an · -er · -or · -ist", partner: "meslek" },
    sections: [
      {
        title: "Sormak ve söylemek",
        body: "Meslek sorarken en doğal yol: What do you do? Cevapta meslekten önce {a} ya da {an} şarttır: I'm {a} teacher. Türkçede 'Öğretmenim' deriz; İngilizcede a'yı unutma.",
        examples: [
          { en: "What do you do? — I'm {a} [nurse].", tr: "Ne iş yapıyorsun? — Hemşireyim." },
          { en: "My father is {an} [engineer].", tr: "Babam mühendis." },
          { en: "She works as {a} [designer] in Istanbul.", tr: "İstanbul'da tasarımcı olarak çalışıyor." },
          { en: "I want to be {a} [pilot] one day.", tr: "Bir gün pilot olmak istiyorum." },
        ],
      },
      {
        title: "Sık meslekler",
        table: {
          head: ["İngilizce", "Türkçe", "Nerede?"],
          rows: [
            ["[doctor]", "doktor", "hospital"],
            ["[nurse]", "hemşire", "hospital"],
            ["[teacher]", "öğretmen", "school"],
            ["[engineer]", "mühendis", "office, factory"],
            ["[lawyer]", "avukat", "court, office"],
            ["[accountant]", "muhasebeci", "office"],
            ["[chef] / [cook]", "aşçı", "restaurant"],
            ["[waiter] / [waitress]", "garson", "restaurant, café"],
            ["[driver]", "şoför", "bus, taxi"],
            ["[police officer]", "polis memuru", "police station"],
            ["[shop assistant]", "tezgâhtar", "shop"],
            ["[hairdresser]", "kuaför", "salon"],
            ["[dentist]", "diş hekimi", "clinic"],
            ["[software developer]", "yazılımcı", "office, home"],
          ],
        },
      },
      {
        title: "-er, -or, -ist: meslek ekleri",
        body: "Birçok meslek bir kelimeye ek getirilerek yapılır, Türkçedeki '-ci' gibi: teach → teach{er}, act → act{or}, art → art{ist}.",
        table: {
          head: ["Kök", "Meslek", "Anlamı"],
          rows: [
            ["teach", "teach{er}", "öğretmen"],
            ["drive", "driv{er}", "şoför"],
            ["bake", "bak{er}", "fırıncı"],
            ["clean", "clean{er}", "temizlikçi"],
            ["act", "act{or}", "oyuncu"],
            ["art", "art{ist}", "sanatçı"],
            ["science", "scient{ist}", "bilim insanı"],
            ["tooth (dent-)", "dent{ist}", "diş hekimi"],
          ],
        },
      },
      {
        title: "a mı, an mı?",
        body: "Meslek bir sesli harf sesiyle başlıyorsa {an}: {an} engineer, {an} actor, {an} architect. Diğerlerinde {a}. Bakılan harf değil, ses: {a} university ('yu' sesi), {an} hour ('h' okunmaz).",
        examples: [
          { en: "She's {an} [architect].", tr: "Mimar." },
          { en: "He's {a} [police officer].", tr: "Polis memuru." },
          { en: "Is your brother {a} [lawyer]?", tr: "Ağabeyin avukat mı?" },
          { en: "They're [doctors].", tr: "Onlar doktor." },
        ],
        note: "Çoğulda a / an yok: They're teachers. We're students.",
      },
    ],
    mistakes: [
      { wrong: "I'm ~~teacher~~.", right: "I'm {a} teacher.", why: "Tek bir kişinin mesleğinden önce a / an şart." },
      { wrong: "She's ~~a~~ engineer.", right: "She's {an} engineer.", why: "Sesli harf sesi: an." },
      { wrong: "They're ~~a doctors~~.", right: "They're doctors.", why: "Çoğulda a / an kullanılmaz." },
      { wrong: "~~What is your work?~~", right: "What do you do?", why: "Meslek sormanın en doğal yolu budur; 'work' sayılamaz bir isimdir." },
    ],
    tip: "Meslek söylerken 'a'yı yutma: 'I'm {a} nurse' tek nefeste 'aym ı nörs'. Türkçede karşılığı olmadığı için en sık unutulan kelime bu.",
    quiz: [
      { kind: "choice", prompt: "Who works in a hospital and helps doctors?", tr: "Hastanede çalışıp doktorlara yardım eden kim?", options: ["a nurse", "a lawyer", "a farmer"], answer: 0, explain: "**Nurse** = hemşire." },
      { kind: "choice", prompt: "My uncle is ___ engineer.", tr: "Amcam mühendis.", options: ["a", "an", "—"], answer: 1, explain: "engineer sesli harfle başlıyor: **an**." },
      { kind: "choice", prompt: "She's ___ honest lawyer.", tr: "Dürüst bir avukat.", options: ["a", "an", "—"], answer: 1, explain: "honest'ta h okunmaz; ses sesliyle başlar: **an** honest lawyer." },
      { kind: "choice", prompt: "Who helps people with the law, often in court?", tr: "Kim insanlara hukuk konusunda, çoğu zaman mahkemede yardım eder?", options: ["a lawyer", "an accountant", "a waiter"], answer: 0, explain: "**Lawyer** = avukat. Accountant muhasebeci, waiter garson." },
      { kind: "type", prompt: "Someone who teaches is a ___.", tr: "Öğreten kişi bir …", answer: ["teacher"], explain: "teach + **er** = teacher." },
      { kind: "type", prompt: "Someone who drives a bus is a bus ___.", tr: "Otobüs kullanan kişi bir otobüs …", answer: ["driver"], explain: "drive + **r** = driver." },
      { kind: "choice", prompt: "What do you ___? — I'm a chef.", tr: "Ne iş yapıyorsun? — Aşçıyım.", options: ["do", "work", "job"], answer: 0, explain: "Kalıp: What do you **do**?" },
      { kind: "order", tr: "Kız kardeşim bir avukat.", answer: "My sister is a lawyer.", extra: ["an", "lawyers"], explain: "lawyer sessizle başlıyor: **a** lawyer." },
      { kind: "order", tr: "Onlar hemşire.", answer: "They are nurses.", extra: ["a", "nurse"], explain: "Çoğulda a yok: They are **nurses**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["He's an engineer.", "They're a nurses.", "I'm a teacher."], answer: 1, explain: "Çoğulda a yok: **They're nurses.**" },
    ],
  },
};
