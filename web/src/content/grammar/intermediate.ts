import type { Recall, TopicBody } from "./types";

/** Intermediate: noun cases into English, object pronouns, reflexive pronouns. */
export const INTERMEDIATE: Record<string, TopicBody> = {
  "noun-cases": {
    intro: "Türkçede isim cümledeki işine göre ek alır: arabayı, okula, evde, İzmir'den. İngilizcede bu ekler yok. Onların işini ya kelimenin cümledeki yeri ya da to, in, at, from gibi küçük bir kelime görür. Dört eki tek tek İngilizceye taşıyalım.",
    glance: {
      idea: "Türkçe eki ismin sonuna takar: okul{a}, ev{de}, İzmir'{den}. İngilizce ismi hiç değiştirmez, önüne {to}, {at}, {from} gibi küçük bir kelime koyar. -i'nin işini ise sıra görür.",
      formulas: [
        {
          label: "-i: sıra",
          parts: [
            { text: "I", role: "plain", name: "özne" },
            { text: "see", role: "extra", name: "fiil" },
            { text: "the bus.", role: "focus", name: "-i → fiilin ardı" },
          ],
        },
        {
          label: "-e ve -den: yön",
          parts: [
            { text: "I go", role: "extra", name: "özne + fiil" },
            { text: "from", role: "focus", name: "-den → from" },
            { text: "home", role: "partner", name: "nereden?" },
            { text: "to", role: "focus", name: "-e → to" },
            { text: "work.", role: "partner", name: "nereye?" },
          ],
        },
        {
          label: "-de: yer",
          parts: [
            { text: "The cat is", role: "plain", name: "özne + be" },
            { text: "in", role: "focus", name: "-de → in/at/on" },
            { text: "the box.", role: "partner", name: "nerede?" },
          ],
        },
      ],
      compare: [
        { tr: "Otobüs{ü} <görüyorum>.", en: "I <see> {the bus}." },
        { tr: "[Ev]{den} [iş]{e} <giderim>.", en: "I <go> {from} [home] {to} [work]." },
        { tr: "[Ev]{de}yim.", en: "I'm {at} [home]." },
      ],
      compareNote: "Türkçe ek ismin sonuna gelir, İngilizce karşılığı ismin önüne; -i'nin karşılığı ise bir kelime değil, fiilin hemen arkasındaki yerdir.",
    },
    legend: { focus: "Türkçe ek ve İngilizce karşılığı", partner: "isim: yer, kişi, eşya", extra: "fiil" },
    sections: [
      {
        title: "Dört ek, dört karşılık",
        body: "Türkçede 'okul' cümleye göre okul{u}, okul{a}, okul{da}, okul{dan} olur. İngilizcede [school] hiç değişmez; ekin işini ismin önüne gelen küçük bir kelime görür: {to} [school], {at} [school], {from} [school]. Bu kelimelere edat denir; yalnızca -i'nin edatı yok, nesne fiilin hemen arkasına gelir.",
        table: {
          head: ["Türkçe hali", "İngilizce", "Örnek"],
          rows: [
            ["-i · belirtme", "ek yok · nesne fiilin hemen arkasında", "otobüs{ü} gör → <see> {the bus}"],
            ["-e · yönelme", "{to} · {into} · {at}", "okul{a} git → <go> {to} [school]"],
            ["-de · bulunma", "{in} · {at} · {on}", "kutu{da} → {in} [the box]"],
            ["-den · ayrılma", "{from} · {out of} · {off}", "İzmir'{den} → {from} [İzmir]"],
          ],
          caption: "Türkçe ek kelimenin sonuna gelir; İngilizce edat ismin önüne. Ek kuyruktaysa edat başta.",
        },
      },
      {
        title: "-i: ek yok, sıra var",
        body: "Türkçede -i eki nesneyi, yani işten etkilenen şeyi, cümlenin her yerinde belli eder: 'Arabayı Ali yıkıyor' da olur, 'Ali arabayı yıkıyor' da. İngilizcede ek olmadığı için iş sıraya kalır: önce özne (işi yapan), sonra <fiil>, hemen arkasından {nesne}. Araya edat girmez.",
        examples: [
          { en: "Ali <is washing> {the car}.", tr: "Ali araba{yı} <yıkıyor>." },
          { en: "I <know> {your sister}.", tr: "Kız kardeşin{i} <tanıyorum>." },
          { en: "<Close> {the window}, please.", tr: "Pencere{yi} <kapat> lütfen." },
          { en: "We <love> {this song}.", tr: "Bu şarkı{yı} çok <seviyoruz>." },
        ],
        note: "-i çoğu zaman bir the olarak geri gelir. 'Kitab{ı} okuyorum' = I'm reading {the} book (belli bir kitap). 'Kitap okuyorum' = I'm reading {a} book (herhangi biri).",
      },
      {
        title: "-e: to, into, at",
        body: "Yönelme ekinin en sık karşılığı {to}: bir yere gitmek, birine bir şey vermek. Bir şeyin içine giriliyorsa {into}; bir şeye ya da birine bakılıyorsa {at}.",
        table: {
          head: ["Türkçe", "İngilizce", "Ne zaman?"],
          rows: [
            ["okul{a} gitmek", "<go> {to} [school]", "bir yere gitmek, gelmek"],
            ["Ece'{ye} vermek", "<give> it {to} [Ece]", "birine vermek, göndermek, yazmak"],
            ["araba{ya} binmek", "<get> {into} [the car]", "bir şeyin içine"],
            ["{bana} bakmak", "<look> {at} [me]", "bakmak, gülümsemek"],
          ],
        },
        examples: [
          { en: "I <go> {to} [the gym] three times a week.", tr: "Haftada üç kez [spor salonu]{na} giderim." },
          { en: "<Send> the photos {to} [me], please.", tr: "Fotoğrafları {bana} gönder lütfen." },
          { en: "<Put> the keys {into} [the bag].", tr: "Anahtarları [çanta]{ya} koy." },
          { en: "Why <are> you <looking> {at} [me]?", tr: "Neden {bana} bakıyorsun?" },
        ],
        note: "Bazen -e'nin İngilizcede hiç karşılığı yoktur: 'Eve gidiyorum' = I'm going [home]. home, here, there ve abroad önüne to almaz.",
      },
      {
        title: "-de: in mi, at mi, on mu?",
        body: "Türkçede tek ek var, İngilizcede üç seçenek. Karar veren [isim]: içinde olunan bir alan mı ({in}), bir nokta ya da orada yapılan iş mi ({at}: işte, okulda), üstünde durulan bir yüzey mi ({on})? Aynı üçlü zaman için de kullanılır.",
        table: {
          head: ["Edat", "Yer", "Zaman"],
          rows: [
            ["{in}: içinde", "{in} [the box] · {in} [the kitchen] · {in} [Ankara] · {in} [Turkey]", "{in} [May] · {in} [2027] · {in} [the morning] · {in} [summer]"],
            ["{at}: bir nokta, bir işlev", "{at} [home] · {at} [work] · {at} [school] · {at} [the bus stop]", "{at} [five] · {at} [night] · {at} [the weekend]"],
            ["{on}: bir yüzey", "{on} [the table] · {on} [the wall] · {on} [the second floor] · {on} [Bağdat Street]", "{on} [Monday] · {on} [5 May] · {on} [my birthday]"],
          ],
          caption: "Kaba kural: in büyük ve içi olan bir alan, at küçük bir nokta, on üstünde durulan bir yüzey.",
        },
        examples: [
          { en: "My brother is {at} [work] now.", tr: "Ağabeyim şu an [iş]{te}." },
          { en: "Your keys are {on} [the table].", tr: "Anahtarların [masa]{da}." },
          { en: "My sister lives {in} [Germany].", tr: "Kız kardeşim [Almanya]'{da} yaşıyor." },
          { en: "The meeting is {at} [ten] {on} [Monday].", tr: "Toplantı pazartesi saat [on]{da}." },
        ],
        note: "'Evde' her zaman {at} [home]: in de yok, the da yok. İş, okul ve hastane için de çoğu zaman at; binanın içini değil, oradaki işi düşünürsün: {at} [work], {at} [school].",
      },
      {
        title: "-den: from, out of, off",
        body: "Ayrılma ekinin temel karşılığı {from}: nereden geldiğin, bir şeyi kimden aldığın. Bir şeyin içinden çıkılıyorsa {out of}, bir şeyin üstünden iniliyorsa {off}.",
        table: {
          head: ["Türkçe", "İngilizce", "Ne zaman?"],
          rows: [
            ["İzmir'{den} gelmek", "<come> {from} [İzmir]", "başlangıç, köken"],
            ["annem{den} bir mesaj", "a message {from} [my mother]", "gönderen"],
            ["oda{dan} çıkmak", "<go> {out of} [the room]", "bir şeyin içinden"],
            ["otobüs{ten} inmek", "<get> {off} [the bus]", "bir şeyin üstünden"],
          ],
        },
        examples: [
          { en: "This email is {from} [the bank].", tr: "Bu e-posta [banka]{dan}." },
          { en: "<Take> the milk {out of} [the fridge], please.", tr: "Sütü [buzdolabı]{ndan} çıkar lütfen." },
          { en: "We <get> {off} [the train] at the next stop.", tr: "Bir sonraki durakta [tren]{den} iniyoruz." },
          { en: "She <works> {from} [home] on Fridays.", tr: "Cuma günleri [ev]{den} çalışıyor." },
        ],
        note: "Araba{dan} inmek = get {out of} [the car], otobüs{ten} inmek = get {off} [the bus]. Binerken de aynı: get {into} the car, get {on} the bus. İçinde ayakta durabiliyorsan on, yalnızca oturabiliyorsan in.",
      },
      {
        title: "Ek başka, edat başka",
        body: "Bazı fiillerde Türkçe ek ile İngilizce edat birbirini tutmaz. -e alan bir fiil İngilizcede edatsız olabilir, -i alan bir fiil de bir edat isteyebilir. Bunları fiille birlikte, kalıp olarak öğren.",
        table: {
          head: ["Türkçe", "İngilizce", "Dikkat"],
          rows: [
            ["{bana} yardım et", "<help> {me}", "edat yok"],
            ["{ona} sor", "<ask> {him}", "edat yok"],
            ["{beni} dinle", "<listen> {to} [me]", "Türkçede -i, İngilizcede to"],
            ["{beni} bekle", "<wait> {for} [me]", "Türkçede -i, İngilizcede for"],
            ["İstanbul'{a} varmak", "<arrive> {in} [İstanbul]", "to değil; şehir ve ülke için in"],
            ["havaalanı{na} varmak", "<arrive> {at} [the airport]", "to değil; bina ve durak için at"],
            ["ev{den} çıkmak", "<leave> {home}", "from yok"],
            ["köpek{ten} korkmak", "be afraid {of} [dogs]", "from değil, of"],
          ],
          caption: "Sözlükte bir fiile bakarken edatına da bak: listen to, wait for, look at, arrive in.",
        },
      },
    ],
    mistakes: [
      { wrong: "I go ~~to home~~ after work.", right: "I go [home] after work.", why: "home önüne to gelmez: go home, come home." },
      { wrong: "I'm ~~in home~~ tonight.", right: "I'm {at} [home] tonight.", why: "'Evde' = at home. in yok, the yok." },
      { wrong: "I see ~~to him~~ every day.", right: "I <see> {him} every day.", why: "-i ekinin karşılığı bir edat değil; nesne fiilin hemen arkasına gelir." },
      { wrong: "We ~~arrive to~~ Ankara at nine.", right: "We arrive {in} [Ankara] at nine.", why: "arrive to almaz: şehir ve ülke için in, bina ve istasyon için at." },
      { wrong: "Please ~~listen me~~.", right: "Please <listen> {to} [me].", why: "Türkçede 'beni dinle' -i alır ama İngilizcede listen to." },
    ],
    tip: "Ek kuyruktur, edat şapka: Türkçe kelime ekini arkasında taşır, İngilizce kelime edatını başına takar. okul{a} → {to} school, ev{de} → {at} home, İzmir'{den} → {from} İzmir. -i'nin şapkası yok; nesneyi fiilin arkasına koyman yeter: I <see> {you}.",
    quiz: [
      { kind: "choice", prompt: "My keys are ___ the table.", tr: "Anahtarlarım masada.", options: ["on", "in", "at"], answer: 0, explain: "Masanın üstü bir yüzey: **on** the table." },
      { kind: "choice", prompt: "I'm ___ home all day today.", tr: "Bugün bütün gün evdeyim.", options: ["in", "at", "on"], answer: 1, explain: "'Evde' = **at home** (the yok)." },
      { kind: "choice", prompt: "We arrive ___ London at six.", tr: "Saat altıda Londra'ya varıyoruz.", options: ["to", "in", "at"], answer: 1, explain: "arrive to almaz; şehir için **arrive in**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I'm at home now.", "I see to him every day.", "Look at me."], answer: 1, explain: "-i'nin karşılığı edat değil: I see **him** every day." },
      { kind: "choice", prompt: "Please wait ___ me.", tr: "Lütfen beni bekle.", options: ["—", "for", "to"], answer: 1, explain: "Türkçede -i, İngilizcede **wait for**." },
      { kind: "choice", prompt: "This message is ___ my boss.", tr: "Bu mesaj patronumdan.", options: ["from", "of", "out of"], answer: 0, explain: "Gönderen: **from**." },
      { kind: "type", prompt: "Take the cake ___ of the box.", tr: "Pastayı kutudan çıkar.", answer: ["out"], explain: "İçinden çıkarmak: **out of** the box." },
      { kind: "type", prompt: "Look ___ this photo!", tr: "Şu fotoğrafa bak!", answer: ["at"], explain: "Bakmak: look **at**." },
      { kind: "type", prompt: "My birthday is ___ June.", tr: "Doğum günüm haziranda.", answer: ["in"], explain: "Ay: **in** June." },
      { kind: "type", prompt: "Get ___ the bus at the next stop.", tr: "Bir sonraki durakta otobüsten in.", answer: ["off"], explain: "Otobüsten inmek: get **off** the bus." },
      { kind: "order", tr: "Çocuklar okulda.", answer: "The children are at school.", extra: ["on", "to"], explain: "Okulun işi: **at** school, the yok." },
      { kind: "order", tr: "Akşam yemeğinden sonra eve giderim.", answer: "I go home after dinner.", extra: ["to", "at"], explain: "home önüne to gelmez: **go home**." },
      { kind: "order", tr: "Sütü buzdolabından çıkar.", answer: "Take the milk out of the fridge.", extra: ["off", "at"], explain: "İçinden çıkarmak: **out of**." },
    ],
  },

  "object-pronouns": {
    intro: "Türkçede 'o' kelimesi yerine göre onu, ona, ondan olur. İngilizcede de özne zamiri nesne olunca kılık değiştirir: he → him, she → her. Ama iş daha kolay: her kişinin tek bir nesne hali var, dört değil.",
    glance: {
      idea: "İşi yapan <I>, <he>, <she>; işten etkilenen {me}, {him}, {her}. Türkçedeki beni, bana, benimle İngilizcede hep {me}'dir; farkı önündeki fiil ya da edat yapar.",
      formulas: [
        {
          label: "Fiilden sonra",
          parts: [
            { text: "She", role: "extra", name: "özne" },
            { text: "loves", role: "partner", name: "fiil" },
            { text: "him.", role: "focus", name: "me · him · her…" },
          ],
        },
        {
          label: "Edattan sonra",
          parts: [
            { text: "She", role: "extra", name: "özne" },
            { text: "lives", role: "plain", name: "fiil" },
            { text: "with", role: "partner", name: "edat" },
            { text: "us.", role: "focus", name: "me · us · them…" },
          ],
        },
        {
          label: "Eşya da nesne",
          parts: [
            { text: "I", role: "extra", name: "özne" },
            { text: "love", role: "partner", name: "fiil" },
            { text: "it.", role: "focus", name: "it · them" },
          ],
        },
      ],
      compare: [
        { tr: "{Beni} [ara].", en: "[Call] {me}." },
        { tr: "{Bana} [yardım et].", en: "[Help] {me}." },
        { tr: "{Benim}[le] gel.", en: "Come [with] {me}." },
      ],
      compareNote: "Türkçede 'ben' ek alıp kılık değiştirir (beni, bana, benimle); İngilizcede hep {me} kalır, ekin işini önündeki fiil ya da edat görür.",
    },
    legend: { extra: "özne (I, he…)", focus: "nesne zamiri (me, him…)", partner: "onu isteyen fiil ya da edat" },
    sections: [
      {
        title: "Özne ve nesne",
        body: "Zamir, ismin yerine geçen kelimedir (ben, sen, o). İşi yapan özne zamiridir: <I>, <he>, <they>. İşten etkilenen ya da with, to, for gibi bir edattan sonra gelen ise nesne zamiri: {me}, {him}, {them}; Türkçedeki 'beni, bana, benimle'nin işini görür.",
        table: {
          head: ["Özne", "Nesne", "Türkçe"],
          rows: [
            ["<I>", "{me}", "beni, bana, benden…"],
            ["<you>", "{you}", "seni, sana · sizi, size…"],
            ["<he>", "{him}", "onu, ona (erkek)"],
            ["<she>", "{her}", "onu, ona (kadın)"],
            ["<it>", "{it}", "onu, ona (eşya, hayvan)"],
            ["<we>", "{us}", "bizi, bize…"],
            ["<they>", "{them}", "onları, onlara…"],
          ],
          caption: "you ve it hiç değişmez. her iki iş görür: 'onu' (nesne) ve 'onun' (sahiplik).",
        },
      },
      {
        title: "Fiilden hemen sonra",
        body: "Nesne zamiri fiilin hemen arkasına gelir, araya bir şey girmez. <She> [loves] {him}: önce kim, sonra ne yapıyor, sonra kimi.",
        examples: [
          { en: "<I> [know] {her} very well.", tr: "{Onu} çok iyi tanıyorum." },
          { en: "[Call] {me} tonight, please.", tr: "Bu akşam {beni} ara lütfen." },
          { en: "<My parents> [visit] {us} every Sunday.", tr: "Annemle babam her pazar {bizi} ziyaret eder." },
          { en: "<We> [are helping] {them} with the move.", tr: "Taşınmada {onlara} yardım ediyoruz." },
        ],
        note: "Türkçede 'ona yardım et' -e alır ama İngilizcede edat yok: [help] {him}. Aynı şekilde: [ask] {her}, [tell] {them}, [answer] {me}.",
      },
      {
        title: "Edattan sonra",
        body: "with, for, to, at, about, from, between gibi edatlardan sonra da hep nesne zamiri gelir. Türkçedeki 'benimle', 'onlar için', 'senden' kalıplarının hepsi böyle kurulur.",
        examples: [
          { en: "Come [with] {me}, please.", tr: "Lütfen {benimle} gel." },
          { en: "These flowers are [for] {her}.", tr: "Bu çiçekler {onun için}." },
          { en: "<We> are talking [about] {them}.", tr: "{Onlar hakkında} konuşuyoruz." },
          { en: "This stays [between] {you and me}.", tr: "Bu {aramızda} kalsın." },
        ],
        note: "'between you and I' kulağa ne kadar kibar gelse de yanlıştır. between bir edat; arkasındaki iki kişi de nesne halinde: [between] {you and me}.",
      },
      {
        title: "beni, bana, bende: hepsi me",
        body: "Türkçede 'ben' eklerle beş altı kılığa girer. İngilizcede tek kelime var: {me}. Farkı önündeki fiil ya da edat yapar; Türkçedeki ek, İngilizcede o edata dönüşür.",
        table: {
          head: ["Türkçe", "İngilizce", "Örnek"],
          rows: [
            ["beni", "{me}", "Do you [love] {me}?"],
            ["bana", "{me} · [to] {me}", "[Tell] {me}. · Give it [to] {me}."],
            ["bende, üzerimde", "[with] {me} · [on] {me}", "I've got my keys [with] {me}."],
            ["benden", "[from] {me}", "It's a present [from] {me}."],
            ["benimle", "[with] {me}", "Come [with] {me}."],
            ["benim için", "[for] {me}", "Is this coffee [for] {me}?"],
          ],
          caption: "Aynı tablo herkes için geçerli: onu, ona, ondan, onunla = him · to him · from him · with him.",
        },
      },
      {
        title: "it ve them: eşyalar da nesne",
        body: "Türkçede nesneyi çoğu zaman söylemeyiz: 'Çorba nasıl? — Bayıldım.' İngilizcede fiil nesnesiz kalmaz; tek bir şey için {it}, birden çok şey için {them} gelir.",
        examples: [
          { en: "Do you like the soup? — Yes, <I> [love] {it}!", tr: "Çorba nasıl, sevdin mi? — Evet, bayıldım!" },
          { en: "Where are my glasses? <I> [need] {them} now.", tr: "Gözlüğüm nerede? Şimdi {ona} ihtiyacım var." },
          { en: "This is a great song. <I> [listen to] {it} every day.", tr: "Harika bir şarkı. Her gün {onu} dinliyorum." },
          { en: "Your shoes are in the hall. [Put] {them} in the cupboard, please.", tr: "Ayakkabıların koridorda. {Onları} dolaba koy lütfen." },
        ],
        note: "Kısa cevaplarda da nesne zamiri kullanılır: 'Who's there? — It's {me}.' 'I'm hungry. — {Me} too.' 'Who wants tea? — {Me}!'",
      },
      {
        title: "İki nesne: give me / give it to me",
        body: "give, send, show, bring gibi fiillerin iki nesnesi olabilir: kişi ve eşya. Eşya bir isimse önce kişi gelir: [Give] {me} the book. Eşya it ya da them ise önce o gelir, kişi to ile sona geçer: [Give] it [to] {me}.",
        examples: [
          { en: "[Give] {me} the book, please.", tr: "Kitabı {bana} ver lütfen." },
          { en: "[Give] it [to] {me}, please.", tr: "Onu {bana} ver lütfen." },
          { en: "[Show] {them} the photos.", tr: "Fotoğrafları {onlara} göster." },
          { en: "[Send] it [to] {him} today.", tr: "Onu bugün {ona} gönder." },
        ],
      },
    ],
    mistakes: [
      { wrong: "He loves ~~I~~.", right: "<He> [loves] {me}.", why: "Fiilden sonra nesne hali gelir: me." },
      { wrong: "Give it to ~~she~~.", right: "Give it [to] {her}.", why: "Edattan sonra nesne hali: to her." },
      { wrong: "It's a secret between you and ~~I~~.", right: "It's a secret [between] {you and me}.", why: "between bir edat; arkasından gelen iki kişi de nesne halinde." },
      { wrong: "Do you like the cake? — Yes, I ~~love~~.", right: "Yes, <I> [love] {it}.", why: "İngilizcede nesne düşmez; eşya için it." },
      { wrong: "~~Me and Ali~~ are at work.", right: "<Ali and I> are at work.", why: "Cümlede işi yapan özne: I. Kibarlık için kendini sona koy." },
    ],
    tip: "İki kişi varsa ötekini sil ve cümleyi bir daha oku. '~~Me~~ and Ali are at work' → 'Me am at work' kulağı tırmalar; demek ki <Ali and I>. 'Give it to Ali and ~~I~~' → 'Give it to I' tırmalar; demek ki [to] Ali and {me}.",
    quiz: [
      { kind: "choice", prompt: "Ali is my friend. I see ___ every day.", tr: "Ali arkadaşım. Onu her gün görürüm.", options: ["he", "him", "his"], answer: 1, explain: "Fiilden sonra nesne: **him**." },
      { kind: "choice", prompt: "These flowers are for ___.", tr: "Bu çiçekler onlar için.", options: ["they", "them", "their"], answer: 1, explain: "Edattan sonra nesne: for **them**." },
      { kind: "choice", prompt: "Please help ___ with these bags.", tr: "Lütfen bu çantalar için bize yardım et.", options: ["we", "us", "our"], answer: 1, explain: "help + **us**; 'bize' -e alsa da edat yok." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["Come with me.", "Give it to she.", "I love them."], answer: 1, explain: "Edattan sonra nesne: to **her**." },
      { kind: "choice", prompt: "Who's there? — It's ___.", tr: "Kim o? — Benim.", options: ["I", "me", "my"], answer: 1, explain: "Kısa cevapta nesne hali: It's **me**." },
      { kind: "choice", prompt: "Look at ___! They're dancing in the rain.", tr: "Şunlara bak! Yağmurda dans ediyorlar.", options: ["them", "they", "their"], answer: 0, explain: "at bir edat: look at **them**." },
      { kind: "type", prompt: "My sister lives in Ankara. I call ___ every Sunday.", tr: "Kız kardeşim Ankara'da yaşıyor. Onu her pazar ararım.", answer: ["her"], explain: "Kadın, nesne: **her**." },
      { kind: "type", prompt: "Where are my keys? I need ___ now.", tr: "Anahtarlarım nerede? Şimdi onlara ihtiyacım var.", answer: ["them"], explain: "keys çoğul: **them**." },
      { kind: "type", prompt: "It's a secret between you and ___.", tr: "Bu aramızda bir sır.", answer: ["me"], explain: "between'den sonra nesne: you and **me**." },
      { kind: "type", prompt: "Do you like this song? — Yes, I love ___!", tr: "Bu şarkıyı seviyor musun? — Evet, bayılıyorum!", answer: ["it"], explain: "Nesne düşmez: I love **it**." },
      { kind: "order", tr: "Bizi her hafta ziyaret eder.", answer: "She visits us every week.", extra: ["we", "our"], explain: "Fiilden sonra nesne: visits **us**." },
      { kind: "order", tr: "Lütfen benimle gel.", answer: "Please come with me.", also: ["Come with me please."], extra: ["I", "my"], explain: "Edattan sonra nesne: with **me**." },
      { kind: "order", tr: "Anahtarları ona ver.", answer: "Give the keys to him.", also: ["Give him the keys."], extra: ["he", "his"], explain: "to + **him**; ya da Give **him** the keys." },
    ],
  },

  "reflexive-pronouns": {
    intro: "'Kendim yaparım', 'Kendine iyi bak', 'Kendini evinde hisset'. Türkçede 'kendi' çok çalışkan bir kelime. İngilizcede karşılığı -self ile biten zamirler: myself, yourself… Ama dikkat: Türkçede 'kendimi' dediğin her yerde İngilizce onları istemez.",
    glance: {
      idea: "İşi yapan ile işten etkilenen aynı kişiyse 'kendi' gelir: {myself}, {yourself}, {herself}… Ama Türkçedeki her 'kendini' İngilizceye geçmez: I feel happy.",
      formulas: [
        {
          label: "Kendine dönen iş",
          parts: [
            { text: "He", role: "partner", name: "özne" },
            { text: "talks to", role: "extra", name: "fiil" },
            { text: "himself.", role: "focus", name: "-self · -selves" },
          ],
        },
        {
          label: "Tek başına",
          parts: [
            { text: "I", role: "partner", name: "özne" },
            { text: "live", role: "extra", name: "fiil" },
            { text: "by myself.", role: "focus", name: "by + -self" },
          ],
        },
        {
          label: "Vurgu",
          parts: [
            { text: "I", role: "partner", name: "özne" },
            { text: "make", role: "extra", name: "fiil" },
            { text: "the bread", role: "plain", name: "nesne" },
            { text: "myself.", role: "focus", name: "başkası değil" },
          ],
        },
      ],
      compare: [
        { tr: "{Kendini} <kesme>!", en: "Don't <cut> {yourself}!" },
        { tr: "{Tek başıma} <yaşıyorum>.", en: "[I] <live> {by myself}." },
        { tr: "{Kendimi} mutlu <hissediyorum>.", en: "[I] <feel> happy." },
      ],
      compareNote: "İş kendine dönünce iki dil de 'kendi' der; ama 'kendimi mutlu hissediyorum' gibi kalıplarda İngilizce -self kullanmaz.",
    },
    legend: { partner: "özne", focus: "dönüşlü zamir (myself…)", extra: "fiil" },
    sections: [
      {
        title: "Kim, kendini?",
        body: "Her özne zamirinin (I, you, he…) bir -self hali var. Bunlara dönüşlü zamir denir, çünkü iş dönüp yapana gelir. Hangisini seçeceğine [özne] karar verir: [I] … {myself}, [she] … {herself}, [they] … {themselves}.",
        table: {
          head: ["Özne", "Dönüşlü", "Türkçe"],
          rows: [
            ["[I]", "{myself}", "kendim, kendimi, kendime"],
            ["[you] (tek kişi)", "{yourself}", "kendin, kendini"],
            ["[he]", "{himself}", "kendisi (erkek)"],
            ["[she]", "{herself}", "kendisi (kadın)"],
            ["[it]", "{itself}", "kendisi (eşya, hayvan)"],
            ["[we]", "{ourselves}", "kendimiz"],
            ["[you] (birden çok kişi)", "{yourselves}", "kendiniz"],
            ["[they]", "{themselves}", "kendileri"],
          ],
          caption: "Tek kişi -self, birden çok kişi -selves. Çoğu my, your, our ile kurulur; ama him ve them ile: himself, themselves.",
        },
      },
      {
        title: "Eylem kendine dönünce",
        body: "İşi yapan ile işten etkilenen aynı kişiyse nesne zamiri değil, dönüşlü zamir gelir. Aynada gördüğün kişi yine sensin: [I] <see> {myself}, ~~I see me~~ değil.",
        examples: [
          { en: "Careful! [You] are going to <cut> {yourself}.", tr: "Dikkat et! {Kendini} keseceksin." },
          { en: "[She] <is looking at> {herself} in the mirror.", tr: "Aynada {kendine} bakıyor." },
          { en: "[My grandfather] often <talks to> {himself}.", tr: "Dedem sık sık {kendi kendine} konuşur." },
          { en: "[The cat] <is washing> {itself}.", tr: "Kedi {kendini} temizliyor." },
        ],
        note: "{themselves} ile each other farklı: [They] <love> {themselves} = kendilerini seviyorlar. They love each other = birbirlerini seviyorlar.",
      },
      {
        title: "by myself: tek başına",
        body: "by + dönüşlü zamir 'tek başına' demek: ya yalnız (yanında kimse yok) ya da yardımsız (kimse yardım etmiyor). Aynı anlamda: on my own.",
        examples: [
          { en: "[I] <live> {by myself}.", tr: "{Tek başıma} yaşıyorum." },
          { en: "[My son] is three, and he <eats> {by himself} now.", tr: "Oğlum üç yaşında ve artık {kendi kendine} yemek yiyor." },
          { en: "Do [you] <like> travelling {by yourself}?", tr: "{Tek başına} seyahat etmeyi sever misin?" },
          { en: "[She] <is building> the new shelf {by herself}.", tr: "Yeni rafı {kimseden yardım almadan} kuruyor." },
        ],
        note: "by'ı unutma: I live {by myself} = tek başıma yaşıyorum. 'I live myself' diye bir şey yok.",
      },
      {
        title: "Vurgu: ben kendim",
        body: "Dönüşlü zamir bazen sadece vurgu yapar: 'başkası değil, ben'. Türkçedeki 'kendim, bizzat' gibi. Cümlenin sonuna ya da vurgulanan kelimenin hemen arkasına gelir. Çıkarırsan cümle yine doğru kalır, yalnızca vurgu gider.",
        examples: [
          { en: "[I] <make> the bread {myself}.", tr: "Ekmeği {kendim} yapıyorum." },
          { en: "[We] <are going to paint> the flat {ourselves}.", tr: "Daireyi {kendimiz} boyayacağız." },
          { en: "[The manager] {herself} <is coming> to the meeting.", tr: "Toplantıya müdür {bizzat} geliyor." },
          { en: "Don't worry, [I] <will do> it {myself}.", tr: "Merak etme, {kendim} yaparım." },
        ],
      },
      {
        title: "Türkçede 'kendini', İngilizcede yok",
        body: "Türkçede birçok fiil 'kendini' ya da bir ekle dönüşlüdür: kendini iyi hissetmek, rahatlamak, giyinmek, taranmak. İngilizcede bunların çoğu tek başına durur; -self eklersen cümle tuhaflaşır.",
        table: {
          head: ["Türkçe", "İngilizce", "Söyleme"],
          rows: [
            ["kendimi mutlu hissediyorum", "[I] <feel> happy.", "~~I feel myself happy.~~"],
            ["rahatla", "<Relax>.", "~~Relax yourself.~~"],
            ["giyiniyorum", "[I] <get dressed>.", "~~I get dressed myself.~~"],
            ["taranıyorum", "[I] <brush> my hair.", "~~I brush myself.~~"],
            ["kendini işine ver", "<Concentrate> on your work.", "~~Concentrate yourself.~~"],
          ],
        },
        note: "wash, shave ve dress ile myself yanlış değil, ama çoğu zaman gerek yok: [I] <shave> every morning. 'I wash myself every morning' da doğru; yalnızca biraz fazla.",
      },
      {
        title: "Kalıplar: enjoy yourself, help yourself",
        body: "Bazı kalıplar dönüşlü zamirle ezberlenir. En sık kullanılanı enjoy: tek başına durmaz; ya bir şey ister (enjoy the film) ya da kendini. 'İyi eğlenceler!' = <Enjoy> {yourself}!",
        table: {
          head: ["İngilizce", "Türkçe", "Ne zaman?"],
          rows: [
            ["<Enjoy> {yourself}! · <Enjoy> {yourselves}!", "İyi eğlenceler!", "biri partiye ya da tatile giderken"],
            ["<Help> {yourself}.", "Buyur, kendin al.", "masada, ikram ederken"],
            ["<Make> {yourself} at home.", "Kendini evinde hisset.", "misafir gelince"],
            ["<Take care of> {yourself}.", "Kendine iyi bak.", "vedalaşırken"],
            ["<Introduce> {yourself}, please.", "Kendini tanıt lütfen.", "toplantıda, kursta"],
          ],
        },
        examples: [
          { en: "[We] <are> really <enjoying> {ourselves} here.", tr: "Burada çok güzel vakit geçiriyoruz." },
          { en: "There's cake in the kitchen. <Help> {yourself}!", tr: "Mutfakta kek var. Buyur, kendin al!" },
          { en: "[I] always <enjoy> {myself} at your parties.", tr: "Senin partilerinde hep çok eğlenirim." },
        ],
      },
    ],
    mistakes: [
      { wrong: "I feel ~~myself~~ happy today.", right: "[I] <feel> happy today.", why: "feel dönüşlü zamir istemez: 'kendimi … hissediyorum' = I feel …" },
      { wrong: "Sit down and ~~relax yourself~~.", right: "Sit down and <relax>.", why: "relax tek başına 'rahatla' demek." },
      { wrong: "I get dressed ~~myself~~ at seven.", right: "[I] <get dressed> at seven.", why: "get dressed zaten 'giyinmek'; myself fazla." },
      { wrong: "We always ~~enjoy~~ at the beach.", right: "[We] always <enjoy> {ourselves} at the beach.", why: "enjoy tek başına durmaz: ya bir şey (enjoy the beach) ya da kendini (enjoy ourselves)." },
      { wrong: "They are going to do it ~~themself~~.", right: "[They] are going to do it {themselves}.", why: "Birden çok kişi: -selves. ourselves, yourselves, themselves." },
    ],
    tip: "Ayna kuralı: işi yapan ve işten etkilenen aynı kişiyse aynaya bakıyorsun, -self gelir: I <cut> {myself}, she <is looking at> {herself}. feel, relax, get dressed aynaya bakmaz, tek başına durur. Tek kişi -self, kalabalık -selves.",
    quiz: [
      { kind: "choice", prompt: "Careful! You're going to cut ___.", tr: "Dikkat et! Kendini keseceksin.", options: ["you", "yourself", "yourselves"], answer: 1, explain: "Tek kişi, kendine: **yourself**." },
      { kind: "choice", prompt: "My grandmother lives by ___.", tr: "Babaannem tek başına yaşıyor.", options: ["her", "herself", "himself"], answer: 1, explain: "by + **herself** = tek başına." },
      { kind: "choice", prompt: "We are going to paint the house ___.", tr: "Evi kendimiz boyayacağız.", options: ["ourself", "ourselves", "us"], answer: 1, explain: "Birden çok kişi: **ourselves**." },
      { kind: "choice", prompt: "Hangi cümle yanlış?", options: ["I feel myself tired.", "Help yourself!", "He lives by himself."], answer: 0, explain: "feel tek başına durur: I **feel** tired." },
      { kind: "choice", prompt: "Sit down and ___.", tr: "Otur ve rahatla.", options: ["relax", "relax yourself", "relax you"], answer: 0, explain: "relax kendini istemez: **relax**." },
      { kind: "choice", prompt: "I ___ at seven every morning.", tr: "Her sabah yedide giyinirim.", options: ["get dressed", "get dressed myself", "dress me"], answer: 0, explain: "Giyinmek: **get dressed**, myself yok." },
      { kind: "type", prompt: "Enjoy ___, kids!", tr: "İyi eğlenceler çocuklar!", answer: ["yourselves"], explain: "Birden çok kişi: **yourselves**." },
      { kind: "type", prompt: "There's coffee in the kitchen. Help ___!", tr: "Mutfakta kahve var. Buyur, kendin al!", answer: ["yourself"], explain: "Kalıp: **Help yourself**." },
      { kind: "type", prompt: "The children are making breakfast by ___ today.", tr: "Çocuklar bugün kahvaltıyı kendi başlarına hazırlıyor.", answer: ["themselves"], explain: "they → by **themselves**." },
      { kind: "type", prompt: "He is looking at ___ in the mirror.", tr: "Aynada kendine bakıyor.", answer: ["himself"], explain: "Yapan da bakılan da o: **himself**." },
      { kind: "order", tr: "Her sabah işe tek başıma giderim.", answer: "I go to work by myself every morning.", also: ["Every morning I go to work by myself."], extra: ["me", "mine"], explain: "Tek başına: **by myself**." },
      { kind: "order", tr: "Partide çok eğleniyoruz.", answer: "We are enjoying ourselves at the party.", extra: ["us", "ourself"], explain: "enjoy + **ourselves**." },
      { kind: "order", tr: "Kendine iyi bak.", answer: "Take care of yourself.", extra: ["you", "your"], explain: "Kalıp: Take care of **yourself**." },
    ],
  },
};

/** Their "Hatırla" cards. */
export const RECALL_INTERMEDIATE: Record<string, Recall> = {
  "noun-cases": {
    points: [
      "-i'nin karşılığı yok: nesne fiilin hemen arkasına gelir. I <see> {him}.",
      "-e → {to} (gitmek, vermek), {into} (içine), {at} (bakmak).",
      "-de → {in} içinde, {at} bir nokta ya da binanın işi, {on} bir yüzey.",
      "-den → {from}; içinden {out of}, üstünden {off}.",
      "Kalıplar: go [home], {at} [home], listen {to}, wait {for}, arrive {in} / {at}.",
    ],
    examples: [
      { en: "I go {to} [work] {from} [home] by bus.", tr: "[Ev]{den} [iş]{e} otobüsle giderim." },
      { en: "I'm {at} [home] {on} [Sundays].", tr: "Pazar günleri [ev]{de}yim." },
      { en: "<Take> the bread {out of} [the bag].", tr: "Ekmeği [poşet]{ten} çıkar." },
    ],
    trap: { wrong: "I'm ~~in home~~ now.", right: "I'm {at} [home] now." },
  },
  "object-pronouns": {
    points: [
      "Özne işi yapar, nesne işten etkilenir: <I> → {me}, <he> → {him}, <she> → {her}, <we> → {us}, <they> → {them}.",
      "you ve it değişmez.",
      "Fiilden hemen sonra nesne, edat yok: [help] {me}, [call] {her}.",
      "Her edattan sonra nesne: [with] {me}, [for] {them}, [between] {you and me}.",
      "Nesneyi düşürme: Yes, I [love] {it}.",
    ],
    examples: [
      { en: "<We> [visit] {them} every week.", tr: "{Onları} her hafta ziyaret ederiz." },
      { en: "Come [with] {me}, please.", tr: "{Benimle} gel lütfen." },
      { en: "Give it [to] {her}.", tr: "Onu {ona} ver." },
    ],
    trap: { wrong: "Do you like it? — Yes, I ~~love~~.", right: "Yes, <I> [love] {it}." },
  },
  "reflexive-pronouns": {
    points: [
      "Tek kişi -self, birden çok kişi -selves: {myself}, {yourself}, {himself}, {herself}, {itself} · {ourselves}, {yourselves}, {themselves}.",
      "İşi yapan ve etkilenen aynıysa: [I] <cut> {myself}.",
      "by + -self = tek başına: [I] <live> {by myself}.",
      "Vurgu için: [I] <make> it {myself} (başkası değil, ben).",
      "feel, relax, get dressed -self almaz; enjoy ister: <Enjoy> {yourself}!",
    ],
    examples: [
      { en: "[She] <is looking at> {herself} in the mirror.", tr: "Aynada {kendine} bakıyor." },
      { en: "[I] <live> {by myself}.", tr: "{Tek başıma} yaşıyorum." },
      { en: "<Help> {yourself}!", tr: "Buyur, {kendin} al!" },
    ],
    trap: { wrong: "I feel ~~myself~~ happy.", right: "[I] <feel> happy." },
  },
};
