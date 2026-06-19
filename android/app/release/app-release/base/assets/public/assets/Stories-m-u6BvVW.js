import{a5 as W,h as Z,b as R,r as s,j as e,g as L,B as D,e as g,u as $,R as Y,H as J,S as X,m as S,d as f,i as q,t as N,c as Q,A as ee,X as ae}from"./index-rJWnLgDL.js";import{C as ie}from"./clock-CpJR4DxR.js";import{P as j}from"./play-D4sWNnbg.js";import{S as ne,a as re}from"./skip-forward-BEKdZlp7.js";class le{constructor(){this.componentControls=new Set}subscribe(l){return this.componentControls.add(l),()=>this.componentControls.delete(l)}start(l,b){this.componentControls.forEach(z=>{z.start(l.nativeEvent||l,b)})}cancel(){this.componentControls.forEach(l=>{l.cancel()})}stop(){this.componentControls.forEach(l=>{l.stop()})}}const de=()=>new le;function te(){return W(de)}const se=[["path",{d:"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",key:"1xhozi"}]],G=Z("headphones",se);function ue({story:t,onClick:l}){const{t:b,i18n:z}=R("stories"),h=o=>{const y=Math.floor(Date.now()/3e4);let d=0;const u=String(o);for(let H=0;H<u.length;H++)d=(d<<5)-d+u.charCodeAt(H),d|=0;const p=Math.abs(d)+y,A=Math.sin(p)*1e4,w=A-Math.floor(A);return Math.floor(890+w*1410)},[c,x]=s.useState(()=>h(t.id));s.useEffect(()=>{const y=3e4-Date.now()%3e4,d=()=>{x(h(t.id))},u=setTimeout(()=>{d();const p=setInterval(d,3e4);return()=>clearInterval(p)},y);return()=>clearTimeout(u)},[t.id]);const r=(z.language||"en").split("-")[0],m=r==="ar"?"ar-SA":r==="de"?"de-DE":r==="ru"?"ru-RU":r==="tr"?"tr-TR":"en-US",v=new Intl.NumberFormat(m).format(c);return e.jsx(L,{className:"group overflow-hidden border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] rounded-[2rem] bg-white dark:bg-white/5 cursor-pointer hover:shadow-xl transition-all duration-300",onClick:l,children:e.jsxs("div",{className:"flex",children:[e.jsxs("div",{className:"flex-1 p-6 pr-2",children:[e.jsx("h3",{className:"text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-islamic-green dark:group-hover:text-islamic-gold transition-colors mb-2",children:t.title}),e.jsxs("p",{className:"text-sm text-gray-400 line-clamp-2 leading-relaxed italic mb-4",children:[t.content.substring(0,80),"..."]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-2",children:[e.jsxs("div",{className:"flex items-center gap-1 text-[11px] font-bold text-gray-300",children:[e.jsx(ie,{className:"w-3 h-3"})," ",t.duration]}),e.jsxs("div",{className:"flex items-center gap-1 text-[11px] font-bold text-islamic-green dark:text-islamic-gold",children:[e.jsx(D,{className:"w-3 h-3"})," ",b("read")]}),e.jsxs("div",{className:"flex items-center gap-1.5 text-[11px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20",children:[e.jsx(G,{className:"w-3 h-3 animate-pulse"}),e.jsx("span",{children:b("listenersCount",{count:v})})]})]})]}),e.jsx("div",{className:"w-20 bg-islamic-green/5 dark:bg-islamic-gold/10 flex items-center justify-center group-hover:bg-islamic-gold/10 dark:group-hover:bg-islamic-gold/20 transition-colors",children:e.jsx(g,{className:"w-12 h-12 rounded-full bg-islamic-green dark:bg-islamic-gold hover:opacity-90 text-white dark:text-[#032e18] shadow-lg transition-transform group-hover:scale-110",onClick:o=>{o.stopPropagation(),l()},children:e.jsx(j,{className:"w-5 h-5 fill-current"})})})]})})}const ke={prophets:[{id:1,title:"Hz. Yusuf'un Sabrı",content:`Kenan ilinde, geceleri yıldızların en parlak olduğu topraklarda, Yakup Peygamber’in on iki oğlu vardı. Ama içlerinden biri, yüzündeki nur ve kalbindeki masumiyetle diğerlerinden ayrılırdı: Yusuf...

Henüz küçük bir çocukken gördüğü o rüya, kaderinin habercisiydi. Babasına koşup şöyle demişti: "Babacığım! Rüyamda on bir yıldız, güneş ve ayın bana secde ettiklerini gördüm."

Hz. Yakup, bunun büyük bir peygamberlik müjdesi olduğunu anlamış; ama aynı zamanda kıskanç kardeşlerin öfkesinden korkmuştu. "Yavrucuğum" dedi, "Rüyanı sakın kardeşlerine anlatma..."

Ancak kader ağlarını örmeye başlamıştı bile. Kardeşlerinin kalbine düşen kıskançlık ateşi, onları korkunç bir plana sürükledi. Bir gün Yusuf’u kıra götürmek bahanesiyle babalarından izin aldılar. Ve o masum çocuğu, ıssız bir çöldeki karanlık bir kuyuya attılar.

Yusuf kuyunun dibindeydi. Karanlıktı, soğuktu ve yalnızdı. Ama o, küçücük kalbiyle Rabbine sığındı. Allah ona kuyunun dibinde şöyle vahyetti: "Korkma Yusuf... Gün gelecek, onlar farkında bile değilken, bu yaptıklarını yüzlerine vuracaksın."

Kardeşleri, Yusuf’un gömleğini bir kurdun kanıyla boyayıp babalarına götürdüler. Yakup Peygamber, kanlı gömleği eline aldığında, gömleğin hiç yırtılmadığını fark etti. Bir kurt, bir insanı parçalar da gömleği sağlam mı bırakırdı? Yüreği yansa da, gözlerinden yaşlar boşalsa da şöyle dedi: "Artık bana düşen, güzel bir sabırdır..."

... ... ...

Kuyunun yanından geçen bir kervan, su çekmek için kovasını sarkıttı. Kova yukarı çıktığında, su yerine dünya güzeli bir çocuk buldular. Yusuf’u alıp Mısır’ın köle pazarına götürdüler ve onu az bir paraya sattılar.

Yusuf, artık Mısır Azizi’nin sarayında bir köleydi. Ama Allah, ona ilim ve hikmet verdi, onu güzelleştirdi. Zamanla sarayda büyüdü, serpildi. Fakat imtihan bitmemişti. Bu seferki imtihan, kuyudan daha derin, zindandan daha karanlıktı: İftira.

Sarayın hanımı Züleyha’nın teklifini, "Ben Allah'a sığınırım" diyerek reddeden Yusuf, işlemediği bir suç yüzünden zindana atıldı. Zindan... Kimileri için son durak, Yusuf içinse bir eğitim yeriydi. Orada yıllarca kaldı. Suçsuzluğunu haykırmak yerine, tevekkül edip bekledi. Arkadaşlarına rüyalarını yorumladı, hakikati anlattı. Yıllar, sabır taşını çatlatacak kadar uzun sürse de, Yusuf’un inancı dimdik ayaktaydı.

Ve bir gece... Mısır Kralı bir rüya gördü. Yedi zayıf inek, yedi semiz ineği yiyordu. Kimse bu rüyayı yorumlayamadı. O an, zindandaki Yusuf hatırlandı. Yusuf zindandan çıkarıldı, rüyayı yorumladı ve Mısır’ı bekleyen kıtlık yıllarını haber verdi.

Allah’ın planı kusursuz işliyordu. Kuyudaki köle, zindandaki mahkum; şimdi Mısır’ın en yetkili veziri olmuştu.

Yıllar sonra kıtlık baş gösterdiğinde, Kenan ilinden erzak almak için gelenler arasında Yusuf’un kardeşleri de vardı. Onu tanımadılar. Ama Yusuf onları tanıdı. Onlara ne öfke duydu ne de intikam aldı. Sabrının meyvesi olan o büyük affedicilikle onlara gömleğini verdi ve dedi ki: "Bu gömleğimi götürün, babamın yüzüne sürün. Gözleri açılacaktır."

Kenan ilinde, rüzgar Yusuf’un kokusunu getirdiğinde Yakup Peygamber doğruldu: "Eğer bana bunak demezseniz, ben Yusuf’un kokusunu alıyorum" dedi. Gömlek yüzüne sürüldüğünde gözleri açıldı, hüzün yerini vuslata bıraktı.

Yusuf aleyhisselam, tahtına anne ve babasını oturttuğunda, çocukken gördüğü o rüya gerçekleşmişti. Güneş, Ay ve on bir yıldız huzurundaydı.

Kuyunun karanlığından Mısır’ın sultanlığına uzanan bu yolun sırrı tek bir kelimeydi: Sabır. Hz. Yusuf bize öğretti ki; bazen düşmek, yükselmenin ilk adımıdır. Ve Allah, sabredenlerle beraberdir.`,duration:"5 dk",category:"Peygamberler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-yusuf.mp3?alt=media"},{id:2,title:"Hz. Eyüp'ün Şifası",content:`"Şüphesiz ki bu dert bana dokundu... Sen ise, merhametlilerin en merhametlisisin." Enbiya Suresi, 83. Ayet.

Tarih boyunca pek çok peygamber gelip geçmiştir... Ancak "Sabır" denildiğinde akla gelen tek bir isim vardır: Hazreti Eyüp Aleyhisselam.

Onun hikayesi, sadece bir hastalığın iyileşmesi değil... Bir kulun Rabbine olan güveninin, en karanlık anlarda bile, nasıl bir ışığa dönüştüğünün destanıdır.

Hazreti Eyüp, Şam topraklarında yaşayan, Yüce Allah'ın kendisine hem maddi, hem manevi zenginlikler bahşettiği bir peygamberdi. Sayısız sürüsü, geniş arazileri, çokça evladı ve sıhhati yerinde bir bedeni vardı.

Ancak... Hazreti Eyüp'ü değerli kılan bu mallar değildi. O, varlık içindeyken şımarmayan, her lokmasında şükreden, yetimi ve yoksulu sofrasından eksik etmeyen bir kuldu. Melekler bile onun bu sadakatini ve şükrünü gıpta ile anardı.

Fakat Allah, en sevdiği kullarını, en ağır imtihanlarla sınar... Eyüp Peygamber için de, o büyük imtihan vakti gelmişti.

İmtihan kapıyı çaldığında, felaketler arka arkaya geldi. Önce sürüleri telef oldu, ekinleri yandı. Hazreti Eyüp, "Veren Allah, alan Allah" diyerek secdeye kapandı. Ardından, bir depremle evi yıkıldı ve evlatlarını kaybetti. Yüreği yansa da, dili isyan etmedi... "Mülk O'nundur" teslimiyetinden ödün vermedi.

En sonunda imtihan, kendi bedenine geldi. Öyle amansız bir hastalığa yakalandı ki... parmağını kıpırdatacak hali kalmadı. Bedeni yaralar içinde kaldı. Dostları, akrabaları, hatta komşuları ondan yüz çevirdi. Hastalığının bulaşıcı olduğunu düşünerek, onu şehrin dışına, ıssız bir yere çıkardılar.

Yanında tek bir kişi kaldı... Vefakar eşi, Rahime Hatun.

Yıllar geçti... Hazreti Eyüp'ün hastalığı şiddetlendi. Bir gün eşi Rahime Hatun, onun çektiği acılara dayanamayarak şöyle dedi: "Sen bir peygambersin... Rabbine dua etsen de, bu çileyi üzerinden kaldırsa olmaz mı?"

Hazreti Eyüp, o meşhur cevabını verdi:
"Ben Rabbimin bana verdiği sıhhat ve afiyetle seksen yıl yaşadım... Şimdi bu hastalık geleli, henüz o kadar zaman olmadı. Allah'tan şifa istemeye -haya ederim-"

İşte bu, teslimiyetin zirvesiydi. Ancak hastalık artık kalbine ve diline sirayet etmeye... yani Allah'ı zikretmesine engel olmaya başlayınca, durum değişti. Hazreti Eyüp, acıdan şikayet etmek için değil, "kulluk görevini yapamamaktan" korktuğu için ellerini açtı.

Ama ne dua... "Beni iyileştir" demedi. "Bana sağlık ver" demedi. Sadece durumunu arz etti ve hükmü, Sahibine bıraktı:

"Ya Rabbi... Bu dert bana iyice dokundu. Sen, merhametlilerin en merhametlisisin."

Yüce Allah, samimiyetle ve edeple yapılan bu duayı anında kabul etti. Cebrail Aleyhisselam geldi ve Allah'ın emrini iletti:

"Ayağını yere vur! İşte yıkanılacak ve içilecek soğuk bir su."

Hazreti Eyüp, zayıf düşmüş bedeniyle son gücünü toplayıp ayağını toprağa vurdu. O kurak yerden, buz gibi, berrak bir su fışkırdı. Allah emretti: "Bu su ile yıkan ve ondan iç."

Hazreti Eyüp o sudan içtiğinde, içindeki tüm hastalıklar yok oldu. O su ile yıkandığında, dışındaki tüm yaralar kapandı, cildi tazelendi. Bir anda, hastalığından önceki o genç, dinç ve nur yüzlü haline geri döndü.

Hazreti Eyüp'ün imtihanı bitmiş... mükafat dönemi başlamıştı. Eşi Rahime Hatun yanına geldiğinde onu tanıyamadı. Karşısında nur yüzlü bir genç gördüğünde, "Burada hasta bir beyefendi vardı, onu gördünüz mü?" diye sordu. Hazreti Eyüp gülümsedi ve "O benim..." dedi.

Allah, sadece sağlığını değil, kaybettiği her şeyi ona misliyle geri verdi. Ona yeni evlatlar, eskisinden daha büyük mallar ve zenginlikler bahşetti. Hepsinden önemlisi, Kuran-ı Kerim'de kıyamete kadar okunacak bir övgüye mazhar oldu:

"Biz onu sabredici bulduk... Ne güzel kuldur o! O, daima Allah'a yönelirdi."

Hazreti Eyüp'ün hikayesi, sadece geçmişte yaşanmış bir olay değildir. Bugün dertlerle boğuşan her mümin için bir reçetedir. Bize şunu öğretir: İsterken emreder gibi değil, durumunu arz ederek istemek, kul olmanın gereğidir. Sabır, sadece beklemek değil... beklerken ümidi ve güzel ahlakı korumaktır.

Bugün hangi derdin içinde olursan ol, şunu asla unutma: Senin Rabbin, Hazreti Eyüp'ü işiten ve ona şifa veren Rabbin ile aynıdır.

O... merhametlilerin en merhametlisidir.`,duration:"7 dk",category:"Peygamberler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-eyup.mp3?alt=media"},{id:3,title:"Hz. İbrahim ve Ateş",content:`Teslimiyetin Ateşi Söndürdüğü An... Hazreti İbrahim ve Nemrut.

"Allah bize yeter... O, ne güzel vekildir." Al-i İmran Suresi, 173. Ayet.

Tarih, nice krallar ve hükümdarlar görmüştür. Ancak kibirde Nemrut gibisi... teslimiyette ise Hazreti İbrahim Aleyhisselam gibisi az görülmüştür.

Bu hikaye, sadece bir ateşin sönmesi değil; imanın, zulmün en hararetli ateşini bile, nasıl serinlettiğinin hikayesidir.

Babil halkı, kendi elleriyle yonttukları taşlara tapıyor... Kral Nemrut ise kibrin zirvesinde, kendini ilah ilan ediyordu. İşte böyle bir karanlığın ortasında, tek başına bir genç, "La ilahe illallah" diyerek ayağa kalktı. O... Hazreti İbrahim'di.

Nemrut ve kavmi, hakikati kabul etmek yerine zulmü seçti. Nemrut gürledi: "Onu yakın! Ve ilahlarınıza yardım edin!"

Hazreti İbrahim'i yakmak için, o güne kadar görülmemiş büyüklükte bir hazırlık yapıldı. Öyle büyük bir ateş yakıldı ki... sıcaklığından kuşlar bile üzerinden uçamayıp düşüyordu. Ateşin yanına yaklaşmak mümkün olmadığından, Hazreti İbrahim'i fırlatmak için devasa bir mancınık kuruldu.

Hazreti İbrahim mancınığa bindirildi. Karşısında dağ gibi bir ateş... arkasında öfkeli bir kalabalık vardı. Ama onun kalbinde, en ufak bir korku yoktu.

Tam fırlatıldığı anda... Cebrail Aleyhisselam havada, İbrahim Peygamberin yanına geldi ve sordu:
"Ey İbrahim! Bir isteğin, bir ihtiyacın var mı? Emret, bu ateşi söndüreyim."

İşte o an... teslimiyet tarihinin en büyük sözü söylendi. Hazreti İbrahim, Cebrail'e bile sığınmadı. Sadece Allah'a yöneldi ve şöyle dedi:

"Senden bir isteğim yok... Hasbunallah ve nimel vekil... Allah bana yeter. O, ne güzel vekildir."

O, "Kurtar beni" demedi. "Halimi Rabbim biliyor... O'nun bilmesi bana yeter" dedi.

Hazreti İbrahim ateşin tam ortasına düşerken, Yüce Allah ateşe emretti:

"Ey ateş! İbrahim'e karşı serin... ve selamet ol!"

Allah'ın emriyle o dehşet verici alevler, Hazreti İbrahim'i yakmadı. Ateş, onu üşütmeyecek kadar tatlı bir serinliğe... odunlar ise yemyeşil bir bahçeye dönüştü. İbrahim Peygamber, ateşin ortasında, güller içinde Rabbine namaz kıldı.

Bu kıssa bize şunu öğretir: Mesele ateşin büyüklüğü değil... teslimiyetin büyüklüğüdür.

Eğer biz de Hazreti İbrahim gibi Allah'a güvenirsek... Rabbimiz bizim için de dertleri dermana, ateşleri gül bahçesine çevirmeye kadirdir.`,duration:"5 dk",category:"Peygamberler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-ibrahim.mp3?alt=media"},{id:4,title:"Hz. Musa ve Deniz",content:`Bu hikaye... sadece bir denizin ikiye yarılması değil; imanın, korku duvarlarını nasıl yıktığının... ve "Bitti" denilen yerde, Allah'ın nasıl "Yetti" dediğinin destanıdır.

Mısır diyarı, İsrailoğulları için acı dolu bir zindana dönüşmüştü. Gökyüzü maviydi belki ama, kölelerin dünyası kapkaraydı. Firavun, kendini haşa yeryüzünün Rabbi ilan etmiş, zulmün her türlüsünü reva görüyordu. Yeni doğan erkek çocukları katlediliyor, kadınlar köleleştiriliyor, bir halk, kırbaç sesleri altında inliyordu.

İşte tam bu karanlığın ortasında... Allah, Hazreti Musa'yı bir nur, bir kurtarıcı olarak gönderdi. Hazreti Musa, saraylarda büyümüştü ama kalbi, mazlumlarla beraberdi.

Uzun ve çetin mücadelelerden sonra, Alemlerin Rabbinden o beklenen emir geldi:
"Kullarımı geceleyin yola çıkar! Muhakkak ki siz, takip edileceksiniz."

Gecenin karanlığı, Mısır'ın üzerine bir örtü gibi serildiğinde... binlerce insan, sessizce evlerinden çıktı. Anneler bebeklerini sıkıca bağırlarına bastı, yaşlılar titreyen bacaklarına güç vermesi için asalarına dayandı. Yıllardır süren esaret zincirlerini kırmak için, özgürlüğe doğru, bilinmeze doğru o büyük yürüyüş başladı.

Ancak... Firavun'un casusları uyumuyordu.

Güneş doğup da İsrailoğulları'nın şehri terk ettiği anlaşılınca, Firavun deliye döndü. Kibri, aklının önüne geçti.
"Onlar küçük bir topluluk!" diye haykırdı. "Ve bizi öfkelendirdiler! Ordumu hazırlayın!"

Mısır'ın en seçkin askerleri, en hızlı atları ve demir tekerlekli savaş arabaları toplandı. Yer gök, Firavun ordusunun gürültüsüyle sarsılmaya başladı. Tozu dumana katarak, ölüm saçarak peşlerine düştüler.

Hazreti Musa ve kavmi, uzun bir yolculuğun sonunda Kızıldeniz'in kıyısına varmıştı. Ama o da ne? Karşılarında uçsuz bucaksız, köpüklü dalgalarıyla geçit vermeyen bir deniz... Arkalarında ise ufku kaplayan, yaklaşan ölümün sesi...

Atların kişnemeleri... Savaş arabalarının gürültüsü... Ve kılıçların şakırtısı...

İsrailoğulları, bu iki dehşet arasında sıkışıp kalmıştı. Korku, bir zehir gibi kalplerine yayıldı. Anneler çocuklarına sarılıp ağlamaya, erkekler dövünmeye başladı. İçlerinden bazıları, umutsuzlukla Hazreti Musa'ya haykırdı:
"Ey Musa! Bizi buraya ölelim diye mi getirdin? İşte bak! Yakalandık! Önümüz deniz, arkamız düşman... Kaçacak hiçbir yer kalmadı! Bittik biz!"

Mantık "bitti" diyordu. Gözler "çare yok" diyordu. Şeytan "teslim ol" diye fısıldıyordu.

Ama... Peygamberlik, işte tam da böyle bir anda belli olurdu.

O kaosun, o çığlıkların ortasında... Hazreti Musa Aleyhisselam, bir dağ gibi dimdik durdu. Rüzgar sakalını savururken, gözlerini ufka dikti. Ne denizin büyüklüğü, ne de Firavun'un ordusu onun Allah'a olan güvenini sarsabilirdi.

Kavminin "Yakalandık!" feryatlarına karşı, tarihin en kararlı, en iman dolu cevabını verdi:
"Asla!... Hayır!... Rabbim şüphesiz benimledir... O, bana bir çıkış yolu gösterecektir."

Hazreti Musa, çıkış yolunun nereden olacağını bilmiyordu... Denizin mi yarılacağını, gökten mi inileceğini bilmiyordu. Ama yolu açacak Olan'ı, çok iyi tanıyordu. O, "Halimi Rabbim biliyor... O'nun bilmesi bana yeter" diyordu.

Ve bu muazzam teslimiyetin üzerine... Göklerin kapısı açıldı. Allah'ın yardımı, gecikmedi. Vahiy geldi:
"Ey Musa! Asanı... denize vur!"

Hazreti Musa, elindeki o kuru ağaç dalından asasını, köpüklü sulara vurdu.

O an... zaman durdu. Fizik kuralları sustu. Kainat nefesini tuttu.

Deniz... o devasa su kütlesi... gürültüyle ikiye yarıldı. Sular, her iki tarafta devasa dağlar gibi, kristal duvarlar gibi yükseldi. Denizin tabanı, asırlar sonra ilk kez güneşi gördü ve Allah'ın emriyle kupkuru bir yola dönüştü.

Allah, inanan kulları için... suyun ortasından bir cadde açmıştı.

Hazreti Musa öne geçti, kavmi peşinden yürüdü. Yanlarında yükselen su duvarlarının içinden balıklar onlara bakarken, onlar Allah'ın kudretini seyrederek, korku ve hayranlık içinde karşı kıyıya geçtiler.

Arkalarından gelen Firavun ve ordusu, kibrin verdiği körlükle o yola daldı. "Deniz onlar için açıldıysa, bizim için de açık kalır" sandılar. Oysa o yol, sadece iman edenler içindi.

Son mümin de karşı kıyıya ayak bastığında... Hazreti Musa asasını tekrar kaldırdı. Ve Allah suya "Kapan!" emrini verdi.

Devasa su duvarları... tonlarca ağırlığındaki o sular... Firavun'un ordusunun üzerine çöktü. Ne Firavun'un gücü, ne ordusunun ihtişamı, ne de altın kaplamalı arabaları onları kurtarmaya yetti.

Bir zamanlar "Ben sizin en yüce rabbinizim" diyen Firavun, aciz bir şekilde suyun içinde boğulup gitti.

Dalgalar durulduğunda... geriye sadece Allah'ın mutlak gücü ve inananların şükür gözyaşları kaldı.

Hazreti Musa'nın asası vardı... bizim ise duamız var.

Bu kıssa bize şunu haykırır:
Hayatında "Önüm deniz, arkam düşman" dediğin... "Artık bittim, çıkış yolu yok" dediğin anlar olabilir. Borçlar, hastalıklar, yalnızlıklar senin Kızıldeniz'in olabilir.

Ama unutma... Hazreti Musa'nın Rabbi, senin de Rabbindir.

Eğer sen de, en çaresiz anında kalbini Allah'a bağlar ve "Rabbim benimledir" diyebilirsen... Allah senin için de denizlerin ortasından yollar açacaktır.`,duration:"7 dk",category:"Peygamberler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-musa.mp3?alt=media"},{id:5,title:"Hz. Nuh'un Gemisi",content:`İnsanlık tarihinin ikinci babası... Büyük tufanın kaptanı... Hazreti Nuh Aleyhisselam.

Bu hikaye... sadece tahtadan bir geminin inşası değil; kimse inanmazken inanmanın, herkes alay ederken sabretmenin... ve dalgaların, dağları yuttuğu o dehşet anında, sadece Allah'a sığınmanın destanıdır.

Zamanın bir vaktinde, yeryüzü zifiri bir karanlığa gömülmüştü. İnsanlar, kendilerini yoktan var eden Rablerini unutmuş, elleriyle yonttukları taşlara tapıyorlardı. Güçlüler zayıfları eziyor, yeryüzünde zulüm kol geziyordu.

İşte tam bu sırada... Allah, Hazreti Nuh'u bir uyarıcı olarak gönderdi.

Hazreti Nuh, tam dokuz yüz elli sene boyunca... Bıkmadan, usanmadan kavmini Allah'a çağırdı.

"Ey kavmim!" diye seslendi. "Allah'a kulluk edin! Sizin O'ndan başka ilahınız yoktur."

Ancak... kavmi kulaklarını tıkadı. Kimi onunla alay etti, kimi ona "Mecnun" dedi. Şehrin ileri gelenleri küçümsediler: "Sana mı inanacağız? Sana uyanlar, bizim en aşağılık gördüğümüz fakir insanlar..."

Asırlar geçti... Nesiller değişti ama inkarları değişmedi. Ve nihayet... İlahi sabır tükendi. Artık yeryüzünün temizlenme vakti gelmişti.

Allah, Hazreti Nuh'a vahyetti:

"Ey Nuh! Kavminden, şu ana kadar iman etmiş olanlardan başkası artık iman etmeyecek. Bizim gözetimimiz altında ve vahyimizle... o gemiyi yap!"

Hazreti Nuh, şehrin dışına çıktı. Çölün ortasında, denizin olmadığı, suyun görünmediği kurak bir yerde... devasa bir gemi yapmaya başladı.

O, eline keseri alıp tahtaları çakmaya başladığında... İmtihanın en ağırı başladı. Kavmi yanından her geçtiğinde kahkahalarla gülüyorlardı.

"Ey Nuh!" diyorlardı. "Dün peygamberdin, bugün marangoz mu oldun? Bu koca gemi kumda mı yüzecek?"

Hazreti Nuh ise, kalbindeki o derin imanla, çekicini her vurduğunda onlara şu cevabı veriyordu: "Bugün siz bizimle alay ediyorsunuz... Ama yakında, biz de sizinle alay edeceğiz."

Günler geçti... Gemi tamamlandı. Ve Allah'ın vaadi yaklaştı. Yerden sular fışkırmaya başladı. Allah emretti: "Ailenle birlikte, iman eden o bir avuç mümini gemiye bindir."

Müminler, "Bismillahi mecreha ve mürsaha" (Onun yüzüp gitmesi de, durması da Allah'ın adıyladır) diyerek gemiye bindi.

Ve sonra... göklerin kapıları sonuna kadar açıldı.

Bardaktan boşanırcasına bir yağmur başladı. Aynı anda yer yarıldı. Gökten inen su ile yerden fışkıran su birleşti. Dağlar gibi dalgalar yükselmeye, şehirleri yutmaya başladı.

Kavmin o kibirli insanları... şimdi can havliyle kaçışıyor, sığınacak bir dağ arıyorlardı. Ama su, her yeri kaplıyordu.

O dehşet anında... Hazreti Nuh, geminin güvertesinden oğlunu gördü. Oğlu, gemiye binmeyi reddetmiş, bir kenarda bekliyordu. Bir baba yüreğiyle, son kez seslendi:

"Ey oğulcuğum! Gel bizimle bin, kafirlerden olma! Bugün kurtuluş sadece bu gemidedir!"

Oğlu ise, o son anda bile kibrine yenildi: "Ben bir dağa sığınırım, o beni sudan korur" dedi.

Hazreti Nuh feryat etti: "Bugün Allah'ın emrinden koruyacak hiçbir güç yoktur!"

Sözü daha bitmemişti ki... dev bir dalga aralarına girdi. Ve oğlu da, diğer inkarcılar gibi suların içinde kaybolup gitti. Hazreti Nuh'un gözyaşları, yağmura karıştı.

Artık dünya, büyük bir su küresine dönmüştü. Ne dağ kalmıştı, ne şehir... Her şey silinmişti.

Sadece o gemi... Allah'ın koruması altındaki o tahta levhalar... dalgaların üzerinde bir beşik gibi sallanıyordu.

Nihayet... Allah'ın emri, göklere ve yere ulaştı:

"Ey yer, suyunu yut! Ve ey gök, suyunu tut!"

Sular çekildi... Yağmur dindi... Gemi, Cudi Dağı'nın üzerine, selametle oturdu. Yeryüzü, inananlarla birlikte yeniden, tertemiz bir başlangıca uyandı.

Bu kıssa, binlerce yıl ötesinden bize şunu fısıldar:

Hayatında bazen sen de Hazreti Nuh gibi yalnız kalabilirsin. Etrafındaki herkes "Yanlış yoldasın" diyebilir. "Senin yaptığın bu iş boşuna" diyebilirler. Kendini, çölün ortasında gemi yapıyor gibi çaresiz hissedebilirsin.

Ama sakın unutma...

Eğer emri Allah'tan aldıysan... O gemi mutlaka yüzer.

Tufan ne kadar büyük olursa olsun... Allah'a güvenenler, mutlaka selamete erer.

Yeter ki sen... başkaları ne derse desin, elindeki çiviyi çakmaya, gemini inşa etmeye ve sabretmeye devam et.

Çünkü zafer... inananlarındır.`,duration:"6 dk",category:"Peygamberler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-nuh.mp3?alt=media"}],companions:[{id:6,title:"Hz. Ebubekir'in Sadakati",content:`İslam tarihinin en büyük dostluğu... Peygamberlerin ardından insanlığın en hayırlısı... Sadakatin yaşayan timsali... Hazreti Ebubekir Sıddık.

Bu hikaye... sadece bir yol arkadaşlığı değil; herkesin "yalan" dediği yerde "o söylüyorsa doğrudur" diyebilmenin destanıdır.

Mekke'nin o zorlu yıllarıydı... Hazreti Muhammed Aleyhisselam'a ilk vahiy geldiğinde, insanlar şüphe içindeydi. Ancak Peygamberimiz, bu durumu en yakın dostu Ebubekir'e anlattığında... o, bir saniye bile duraksamadı.

"Sen söylüyorsan, şüphesiz haktır" dedi. Ne bir delil istedi, ne bir mucize bekledi.

Zaman geçti, zulüm arttı. Ve bir gece... Miraç hadisesi yaşandı. Peygamberimiz, bir gecede Mescid-i Aksa'ya gittiğini ve göklere yükseldiğini anlattı.

Müşrikler bunu duyunca, alay ederek kahkahalar attılar. Koşarak Hazreti Ebubekir'in yanına gittiler.

"Ey Ebubekir!" dediler. "Dostun Muhammed neler söylüyor? Bir gecede Kudüs'e gidip geldiğini iddia ediyor. Hala ona inanacak mısın?"

Hazreti Ebubekir, o müşriklere baktı. Yüzünde en ufak bir şüphe yoktu. Tarihe geçen o cevabı verdi:

"Bunu o mu söylüyor?"

"Evet, o söylüyor" dediler.

Hazreti Ebubekir, iman dolu göğsünü gererek şöyle dedi:
"Eğer o söylüyorsa... vallahi doğrudur! Ben onun, göklerden haber getirdiğine inanıyorum da, buna mı inanmayacağım?"

İşte o gün... Ona "Sıddık" lakabı verildi. Yani, tereddütsüz tasdik eden...

Ve hicret emri geldi... O büyük yolculuk...

Müşrikler, Peygamberimizi öldürmek için peşlerine düştü. Sevr Mağarası'na vardıklarında, Hazreti Ebubekir içeri önce kendisi girdi. Mağara karanlıktı, böcekler ve yılanlarla doluydu. Dostuna zarar gelmesin diye, üzerindeki elbiseyi yırttı, mağaradaki delikleri kapattı. Geriye kalan son deliği de... topuğuyla kapattı.

Peygamberimiz, yorgunluktan başını Hazreti Ebubekir'in dizine koyup uyumuştu. O sırada bir yılan, Hazreti Ebubekir'in topuğunu soktu. Canı yandı, gözlerinden yaşlar boşaldı. Ama... Resulullah uyanmasın diye kıpırdamadı bile.

Gözyaşı Peygamberimizin yüzüne damlayınca, Efendimiz uyandı. Hazreti Ebubekir, acısını gizleyerek: "Anam babam sana feda olsun Ya Resulullah... Bir şey beni soktu ama önemli değil" dedi.

İşte sadakat buydu... Kendi canın yanarken, dostunun uykusunu düşünmekti.

Dışarıda ise, eli kılıçlı müşrikler mağaranın ağzına kadar gelmişlerdi. Hazreti Ebubekir, Peygamberimiz için endişeye kapıldı. Fısıldayarak:

"Ya Resulullah... Eğilip ayaklarının dibine baksalar, bizi görecekler. Yakalandık..." dedi.

Kainatın Efendisi gülümsedi. Ve o meşhur teselli ile dostunun yüreğine su serpti:

"Üzülme ey Ebubekir... Korkma... Allah bizimle beraberdir."

Ve Allah... O sadık kulunu ve Resulünü korudu.

Yıllar geçti... İslam ordusu Tebük Seferi'ne hazırlanıyordu. Orduya yardım lazımdı. Hazreti Ömer malının yarısını getirmişti. "Bugün Ebubekir'i geçeceğim" diyordu.

Sonra Hazreti Ebubekir geldi... Evindeki son iğneye kadar her şeyini getirip koydu.

Resulullah sordu: "Ey Ebubekir! Çoluk çocuğuna, evine ne bıraktın?"

Hazreti Ebubekir cevap verdi:
"Onlara... Allah'ı ve Resulünü bıraktım."

Hazreti Ömer bunu duyunca ağladı: "Vallahi, hayır yarışında seni asla geçemem ey Ebubekir..."

Ve o en acı gün geldi çattı... Veda zamanı.

Hazreti Peygamber vefat ettiğinde, Medine yasa boğulmuştu. Sahabeler şoktaydı. Hazreti Ömer kılıcını çekmiş, "Kim öldü derse boynunu vururum!" diye bağırıyordu.

İşte o kaos anında... Yine o sarsılmaz dağ, Hazreti Ebubekir ortaya çıktı. İnsanları susturdu ve şu tarihi hutbeyi okudu:

"Ey İnsanlar! Kim Muhammed'e tapıyorsa, bilsin ki Muhammed ölmüştür. Ama kim Allah'a kulluk ediyorsa... Bilsin ki Allah Hayy'dır, diridir ve asla ölmez!"

O, bu sözleriyle dağılmak üzere olan ümmeti topladı.

Bu hikaye, bize şunu fısıldar:

Gerçek dostluk, iyi günde gülmek değil... Mağarada, ölümün nefesi ensendeyken "Korkma, Allah bizimle" diyebilmektir.

Gerçek sadakat, "Ne bıraktın?" denildiğinde, "Allah yeter" diyebilmektir.

Allah, bizlere de Hazreti Ebubekir'in sadakatinden bir pay nasip etsin..`,duration:"5 dk",category:"Sahabeler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-ebubekir.mp3?alt=media"},{id:7,title:"Hz. Ömer'in Adaleti",content:`Adaletin yeryüzündeki gölgesi... Hakkı batıldan ayıran "Faruk"... Hattab oğlu Ömer.

Bu hikaye... bir halifenin saraylarda değil, halkının dertleriyle nasıl yanıp tutuştuğunun; adaletin sadece hüküm vermek değil, aç bir çocuğun karnını doyurmak olduğunun destanıdır.

Medine uykudaydı... Herkes sıcak yatağında dinlenirken, uyuyamayan biri vardı. İslam Devleti'nin Halifesi, Hazreti Ömer.

Omuzlarında koskoca bir ümmetin yükü... "Dicle kenarında bir kurdun kaptığı koyunun hesabı bile Ömer'den sorulur" korkusuyla, geceleri sokak sokak dolaşır, halkının halini teftiş ederdi.

Yine bir gece, yardımcısı Eslem ile birlikte Medine'nin dışındaki ıssız bir yolda yürüyordu. Uzakta, cılız bir ateşin yandığını gördü.

"Gel ey Eslem!" dedi. "Şurada birileri var, belki bir yolcudur, belki bir ihtiyaç sahibidir. Gidip bakalım."

Ateşin yanına yaklaştıklarında yürek burkan bir manzarayla karşılaştılar. Yaşlı bir kadın, üzerine tencere koyduğu ateşin başında oturuyor; etrafında ise açlıktan ağlayan küçük çocuklar sızlanıyordu.

Hazreti Ömer, selam verdi ve sordu:
"Ey teyze! Bu çocuklar neden böyle ağlıyor? O tencerede ne pişiriyorsun?"

Kadın, karşısındakinin Halife Ömer olduğunu bilmeden, ciğeri yanık bir sesle cevap verdi:

"Çocuklar açlıktan ağlıyor evladım... Tencerede ise sadece su ve çakıl taşları var. Onları 'yemek pişiyor' diye avutuyorum ki, belki beklerken uyuyakalırlar."

Sonra kadın derin bir ah çekti ve şöyle dedi:
"Allah, benimle Ömer arasında hükmünü versin! O halife oldu ama bizim halimizi unuttu."

Bu sözler... Hazreti Ömer'in kalbine bir ok gibi saplandı. Dehşete kapıldı. Olduğu yere çöküp kaldı.

"Ey teyze!" dedi titreyen bir sesle. "Ömer senin bu halde olduğunu nereden bilsin?"

Kadın cevap verdi:
"Madem halife oldu, madem bizim yükümüzü omuzladı... O zaman bilecek! Bilmeyecekse neden halife oldu?"

Hazreti Ömer, bu sözün ağırlığıyla hemen ayağa kalktı. Yardımcısı Eslem'e "Koş!" dedi. "Hemen Beytülmal'e (devlet hazinesine) gidiyoruz."

Soluk soluğa depoya vardılar. Hazreti Ömer, büyük bir çuval un, bir miktar yağ ve hurma hazırladı. Sonra Eslem'e döndü:
"Bu çuvalı sırtıma yükle!"

Eslem şaşırdı, itiraz etti:
"Aman Ya Emirel Müminin! Sen halifesin, bırak ben taşıyayım. Senin yük taşıman doğru olmaz."

Hazreti Ömer, gözleri yaşlı, sesi gür bir şekilde kükredi:

"Çekil ey Eslem! Bugün bu çuvalı sen taşırsın... Ama kıyamet günü benim günahımı kim taşıyacak? O kadının ve yetimlerin hakkını Allah bana sorduğunda, o ateşten yükü benim yerime sen mi sırtlanacaksın?"

Eslem çaresizce geri çekildi. Koca Halife, İslam aleminin lideri Hazreti Ömer... o ağır un çuvalını sırtına aldı. Medine sokaklarında, nefes nefese o kadının çadırına kadar taşıdı.

Vardığında, çuvalı indirdi. Hemen tencerenin başına geçti. Kendi elleriyle unu kavurdu, yağı ekledi. Ateş sönmek üzereydi; yere eğildi, o mübarek sakallarının arasından dumanlar çıkana kadar ateşi üfledi, harladı.

Yemeği pişirdi ve çocukları kendi elleriyle doyurdu.

Çocuklar karınları doyunca gülüşmeye, oynamaya başladılar. Hazreti Ömer, onları bir kenardan izledi. Yüzünde hem bir tebessüm, hem de derin bir hüzün vardı.

Kadın, çocuklarının güldüğünü görünce ellerini açtı:
"Allah senden razı olsun evladım... Vallahi halife olmaya Ömer'den çok sen layıksın."

Hazreti Ömer, başını öne eğdi. Kim olduğunu söylemeye utandı. "Yarın halifenin yanına gel, sana maaş bağlatalım" diyerek oradan ayrıldı.

Ertesi gün kadın, makama geldiğinde... Dün gece kendisine yemek pişiren, ateşi üfleyen o adamın, Halife Ömer olduğunu gördü.

İşte Hazreti Ömer'in adaleti buydu.

O, adaleti sadece mahkeme salonlarında aramazdı. Adalet; açın karnını doyurmak, yetimin başını okşamak ve "Fırat kenarında kaybolan bir devenin hesabını" dahi kendi nefsinde aramaktı.

Onun devrinde kurtla kuzu yan yana gezerdi derler... Çünkü kurdun bile hakkına girmekten korkan bir Ömer vardı başlarında.

Allah bizlere, Hazreti Ömer'in o hassas terazisinden, o sorumluluk bilincinden ve "önce hesap vereceğim" korkusundan bir pay nasip etsin..`,duration:"5 dk",category:"Sahabeler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-omer.mp3?alt=media"},{id:8,title:"Hz. Osman'ın Hayası",content:`Edep denilince akla gelen ilk isim... Peygamber Efendimizin "İki Nur Sahibi" damadı... Meleklerin bile haya ettiği insan... Hazreti Osman.

Bu hikaye... sadece bir halifenin hayatı değil; servetini İslam yoluna sermenin, utancından sesini yükseltememenin... ve kendi evinde, Kuran başındayken şehit edilmenin, o hüzünlü destanıdır.

Hazreti Osman, zengindi, soyluydu ama hepsinden öte... o, "Haya" (utanma duygusu) timsaliydi. O kadar edepliydi ki, kapalı bir odada yıkanırken bile, Allah'tan haya ederek iki büklüm olurdu.

Bir gün, Peygamber Efendimiz evinde istirahat ederken, Hazreti Ebubekir ve Hazreti Ömer içeri girmek için izin istediler. Efendimiz, rahat oturuşunu bozmadan onlarla konuştu.

Sonra... Hazreti Osman kapıya geldi.

Efendimiz, Osman'ın sesini duyar duymaz hemen toparlandı, üzerini düzeltti ve "Buyur et" dedi.

Hazreti Ayşe annemiz bu durumu görünce şaşırdı: "Ya Resulullah! Ebubekir ve Ömer geldiğinde toparlanmadın ama Osman gelince neden böyle davrandın?"

Kainatın Efendisi, tarihe geçen o cevabı verdi:

"Ey Ayşe! Meleklerin bile kendisinden haya ettiği bir adamdan, ben haya etmeyeyim mi?"

İşte Hazreti Osman böyle bir edep abidesiydi. Ama onun hayası, korkaklığından değil, Rabbine olan saygısındandı. Gerektiğinde İslam için malını su gibi akıtırdı.

Medine'ye hicret edildiğinde, Müslümanlar susuzluktan kırılıyordu. Şehirdeki tek tatlı su kuyusu "Rume Kuyusu"ydu ve sahibi olan Yahudi, suyu parayla satıyordu.

Peygamberimiz sordu: "Kim bu kuyuyu satın alıp, Müslümanlara vakfederse, Cennet onundur."

O sırada kimse yerinden kıpırdayamazken, Hazreti Osman sessizce kalktı. O kuyuyu çok büyük bir servet ödeyerek satın aldı. Ve sonra halka dönüp: "Bugünden sonra bu kuyu bedavadır! Zengin de içsin, fakir de!" dedi.

Yıllar geçti... Kaderin cilvesine bakın ki, bir zamanlar Medine'yi suya kavuşturan Hazreti Osman, halifeliğinin son günlerinde kendi evinde susuz bırakıldı.

Fitne ateşi yanmıştı. İsyancılar, Halife Osman'ın evini kuşattılar. "İstifa et" dediler.

Hazreti Osman'ın emrinde koca bir İslam ordusu vardı. Bir işaret etse, o isyancıları darmadağın ederlerdi. Sahabeler, Hazreti Hasan, Hazreti Hüseyin kapısında nöbet tutuyor, "İzin ver savaşalım!" diyorlardı.

Ama Hazreti Osman, o naif, o merhametli halife...

"Hayır!" dedi. "Benim yüzümden, Resulullah'ın şehrinde tek bir damla kan dökülmesine razı olamam. Ben Allah'a kavuşmayı bekliyorum."

Kuşatma günlerce sürdü. Evine su girmesini yasakladılar. Medine'ye kuyuyu bağışlayan Osman, bir bardak suya muhtaç hale getirildi.

Ve o son gün... Cuma günüydü.

Hazreti Osman niyetliydi, oruçluydu. Yorgunluktan hafifçe daldı. Rüyasında, Kainatın Efendisi Hazreti Muhammed Aleyhisselam'ı gördü. Yanında Hazreti Ebubekir ve Hazreti Ömer de vardı.

Resulullah gülümsedi ve: "Ey Osman! Seni çok mu susattılar?" dedi. "Evet Ya Resulullah" dedi Osman.
"Seni kuşattılar mı?" diye sordu. "Evet Ya Resulullah."

Peygamberimiz müjdeyi verdi:
"Öyleyse sabret ey Osman... Bu akşam iftarı bizim yanımızda açacaksın!"

Hazreti Osman sevinçle uyandı. "Bugün kavuşma günüdür" dedi. Üzerine en temiz elbiselerini giydi. Mushaf'ını (Kuran-ı Kerim'ini) açtı ve okumaya başladı.

İsyancılar duvardan atlayıp içeri girdiklerinde, onu Kuran okurken buldular. Kılıçlar çekildi... Ama o, başını kaldırıp onlara bakmadı bile. O, Rabbine odaklanmıştı.

Kılıç darbesi indiğinde... Hazreti Osman'ın mübarek kanı, o sırada okumakta olduğu sayfanın üzerine damladı.

Kanı, tam da şu ayetin üzerine düşmüştü:

"Feseyekfikehumullah..."
(Onlara karşı Allah sana yeter... O işitendir, bilendir.) - Bakara Suresi, 137. Ayet.

O, Kuran okuyarak yaşadığı ömrünü, Kuran'ın üzerine kanını akıtarak tamamladı. Meleklerin utandığı o güzel insan, meleklerin eşliğinde Rabbine yürüdü.

Bu kıssa bize şunu fısıldar:

Edep; sadece insanlardan utanmak değildir. Edep; yalnızken bile Allah'ın seni gördüğünü bilmektir.

Ve gerçek cömertlik; bir kuyuyu satın alıp hibe etmek değil... Canın tehlikedeyken bile, "Müslüman kanı dökülmesin" diye kendi canından vazgeçebilmektir.

Allah bizlere, Hazreti Osman'ın hayasından, edebinden ve o yumuşak huyluluğundan bir pay nasip etsin..`,duration:"5 dk",category:"Sahabeler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-osman.mp3?alt=media"},{id:9,title:"Hz. Ali'nin İlmi",content:`İlmin kapısı... Allah'ın Aslanı... Hikmetin sultanı... Haydar-ı Kerrar... Hazreti Ali Kerremallahu Veche.

Bu hikaye... sadece Zülfikar'ı kuşanan bir cengaverin değil; "Ben ilim şehriyim, Ali de onun kapısıdır" hadisine mazhar olmuş bir dehanın... çözenlerin aciz kaldığı düğümleri, bir kılıç darbesi gibi kesip atan keskin bir aklın destanıdır.

Hazreti Ali... Henüz çocuk yaşta, on yaşında İslam ile şereflenen, ömründe putlara hiç tapmamış o temiz yürek. O, Peygamber Efendimizin evinde, vahyin gölgesinde büyüdü. Cebrail Aleyhisselam ayetleri indirirken o oradaydı... Efendimiz konuşurken dizinin dibindeydi.

Bu yüzden onun ilmi, sonradan kitaplardan öğrenilmiş bir bilgi değil; doğrudan "Nübüvvet Pınarı"ndan içilmiş, saf ve berrak bir suydu. O, yaşayan bir Kuran'dı.

Bir gün Sahabeler, ilmin ne olduğunu anlamak için Peygamber Efendimize sordular.
Efendimiz cevap verdi: "İlim bir hazinedir... Anahtarı ise sorudur. Ali ise, bu ilmin kapısıdır. Kim ilim isterse, o kapıya gelsin."

Hazreti Ali'nin ilmi öyle bir seviyedeydi ki, Hazreti Ömer halifeliği sırasında en çetrefilli, içinden çıkılmaz meselelerle karşılaştığında hemen ona koşar ve şöyle derdi:

"Ali'nin olmadığı bir mecliste, zor bir meseleyle karşılaşmaktan Allah'a sığınırım. Eğer Ali olmasaydı, Ömer helak olurdu."

Onun zekası, şimşek gibi hızlıydı.

Bir gün on kişi geldi ve onu sınamak istediler. Hepsi aynı soruyu sordu: "Ey Ali! İlim mi daha üstündür, yoksa mal mı?"

Hazreti Ali, o ilahi ferasetiyle her birine ayrı, ama her biri hikmet dolu şu cevapları verdi:

"İlim daha üstündür... Çünkü malı sen korursun, ama ilim seni korur."
"İlim daha üstündür... Çünkü mal harcadıkça azalır, ilim ise harcadıkça çoğalır."
"İlim daha üstündür... Çünkü malın sahibi kıyamette hesaba çekilir, ilmin sahibi ise şefaat eder."

Soruyu soranlar, bu cevaplar karşısında başlarını eğdiler ve "Vallahi sen ilmin kapısısın" diyerek tasdik ettiler.

O, sadece dini ilimlerde değil; hitabette, adalette, matematikte ve felsefede de zirveydi. Sözleri, yüzyıllar sonra bile "Nehcü'l Belaga" (Hitabetin Yolu) kitabında insanlığa ışık tutmaya, yol göstermeye devam etti.

Ama onun ilmi, onu kibirli biri yapmadı. Aksine, o ilim onu daha mütevazı, daha zahid yaptı.

Kendi söküğünü diken, arpa ekmeği yiyen, yamalı elbise giyen bir Devlet Başkanıydı. Hazinesi ilim, sarayı ise mescidin hasırıydı. Dünya malı önüne serildiğinde, elinin tersiyle iter ve şöyle derdi:

"Ey Dünya! Git benden başkasını kandır... Senin ömrün kısa, değerin azdır. Ah azıksızlıktan... Ah yolun uzunluğundan..."

Bir gün ona sordular: "Ey Ali! Göklerin sırrını mı daha iyi bilirsin, yerin yollarını mı?"
O, gökyüzünü işaret ederek: "Vallahi, göklerin yollarını, şu Medine'nin sokaklarından daha iyi bilirim" dedi. Çünkü o, bedeniyle yerde, ama ruhuyla hep ötelerde, miracta yaşayan bir veliydi.

Ve o hüzünlü sabah... O karanlık Ramazan sabahı...

İlmin kapısını kapatmaya, hikmetin ışığını söndürmeye geldiler. Kufeli bir hain, İbn-i Mülcem, zehirli kılıcını biledi. Hazreti Ali, sabah namazı için mescide girdiğinde, secdelerin en güzelindeyken... o hain kılıç, başına indi.

Hazreti Ali, kanlar içinde mihraba yığıldığında, ağzından bir feryat değil, bir zafer çığlığı döküldü:

"Fuztu ve Rabbil Ka'be!..."
(Kabe'nin Rabbine andolsun ki... kazandım! Kurtuldum!)

İnsanlar şaşırdı. Ölen bir insan nasıl kazanırdı?
O kazanmıştı... Çünkü şehadet şerbetini içmiş, bu dünyanın yükünden kurtulmuş ve çok sevdiği Resulullah'a kavuşmuştu.

Son nefesini verirken bile ilim saçmaya devam etti. Başucunda ağlayan oğulları Hasan ve Hüseyin'e döndü ve şu ölümsüz vasiyeti bıraktı:

"Yavrularım... Size Allah'tan korkmanızı vasiyet ediyorum. Zalime hasım olun, mazluma yardımcı olun. Ve unutmayın: İnsanlar uykudadır, öldükleri zaman uyanırlar."

Bugün...

Aradan asırlar geçti. Kılıçlar paslandı, saraylar yıkıldı, o dönemin zalim kralları unutulup gitti. Ama Hazreti Ali'nin ilmi, hikmetli sözleri ve adaleti hala dipdiri. Hala milyonlarca insanın yolunu bir kandil gibi aydınlatıyor.

Bu hikaye bize şunu fısıldar:

Gerçek güç, Zülfikar'ı sallayan bilekte değil... Hakkı batıldan ayıran o keskin zekadadır.
Ve gerçek zenginlik, altın dolu sandıklarda değil... "Bana Allah yeter" diyebilen, ilim ve iman dolu bir kalptedir.

Allah bizlere, Hazreti Ali'nin ilminden, cesaretinden, o derin hikmetinden ve şehadet şuurundan bir pay nasip etsin..`,duration:"6 dk",category:"Sahabeler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fhz-ali.mp3?alt=media"},{id:10,title:"Bilal-i Habeşi'nin Ezanı",content:`İslam'ın gür sesi... Peygamber müezzini... Sabrın siyah incisi... Hazreti Bilal-i Habeşi.

Bu hikaye... sadece bir ezan okuma hikayesi değil; taşların altında ezilen bir bedenin, "Allah Birdir" diyerek nasıl arşa yükseldiğinin... ve bir sesin, nasıl milyonların kalbini titrettiğinin destanıdır.

Mekke'nin kavurucu sıcakları...

Ümeyye bin Halef adında zalim bir efendi, kölesi Bilal'i kızgın kumların üzerine yatırır, göğsüne kocaman, tonlarca ağırlığında bir kaya parçası koyardı.

"Muhammed'i inkar et!" diye bağırırdı. "Lata ve Uzza'ya tap! Yoksa seni burada öldürürüm!"

Bilal'in nefesi kesilir, kaburgaları çatırdardı. Ama o siyah inci, acıdan inlemek yerine, gökyüzüne bakar ve tarihin en büyük direnişini haykırırdı:

"Ehad!... Ehad!..."
(Allah birdir... O birdir...)

O taş, Bilal'in bedenini eziyordu ama ruhunu asla ezemiyordu. Çünkü o, özgürlüğü İslam'da bulmuştu.

Ve bir gün... Hazreti Ebubekir geldi. O zalim efendiye, Bilal'in değeri neyse kat kat fazlasını verdi ve onu satın alıp azat etti. Bilal artık hürdü. Artık sadece Allah'ın kuluydu.

Medine yılları başlamıştı... Mescid-i Nebevi inşa edilmişti ama insanları namaza nasıl çağıracaklarını bilmiyorlardı. Kimisi "Çan çalalım" dedi, kimisi "Boru öttürelim".

Ancak Peygamber Efendimiz, insan sesiyle çağırmayı murad etti. Ve rüyalarda öğretilen o sözler, Ezan-ı Muhammedi, ortaya çıktı.

Peygamberimiz, etrafına baktı. O kadar sahabi varken, o kadar soylu kişi varken... O, Habeşistanlı, eski bir köle olan Bilal'e döndü ve:

"Kalk ey Bilal!" dedi. "Sesin gür ve güzeldir... İnsanları kurtuluşa sen çağır."

Bilal, Mescid-i Nebevi'nin yüksek bir yerine çıktı. Ellerini kulaklarına götürdü. Derin bir nefes aldı ve İslam tarihinin ilk ezanını gökyüzüne nakşetti:

"Allahu Ekber... Allahu Ekber!..."

O ses... sadece Medine sokaklarında değil, müminlerin kalbinde yankılandı. Bilal okudukça, insanlar huzurla camiye koştu.

Yıllar geçti... Mekke fethedildi.

Bir zamanlar "Köledir, insan yerine konmaz" denilen Bilal... Peygamberimizin emriyle, Kabe'nin damına çıktı.

Aşağıda, ona işkence eden Mekkeli müşrikler şaşkınlıkla izliyordu. "Şu siyah köle mi Kabe'ye çıkıyor?" diyorlardı.

Evet... İslam, insanı rengine göre değil, kalbine göre yüceltirdi. Bilal, Kabe'nin üzerinde, fethin zaferini ezanla ilan etti. Putlar yıkılmış, Ehad olan Allah'ın adı yükselmişti.

Ama... Her güzelin bir sonu vardı.

Kainatın Efendisi, Refik-i A'la'ya, Yüce Dost'a kavuştuğunda... Medine öksüz kaldı. Bilal, yetim kaldı.

Peygamberimizin vefatının ertesi sabahı, Bilal ezan okumak için minareye çıktı.
"Allahu Ekber" dedi, sesi titredi.
"Eşhedü en la ilahe illallah" dedi, gözyaşları döküldü.

Ama sıra... "Eşhedü enne Muhammeden Resulullah" (Şahitlik ederim ki Muhammed Allah'ın elçisidir) cümlesine gelince...

Bilal'in boğazı düğümlendi. Sesi çıkmadı. Hıçkırıklara boğuldu. Çünkü "Muhammed" ismini andığında, minberde O'nu görememek, Bilal'e ölümden ağır geliyordu.

Yapamadı... "Ben Resulullah'tan sonra Medine'de ezan okuyamam" dedi ve Şam diyarına hicret etti. Yıllarca o güzel sesinden mahrum kaldı ümmet.

Yıllar sonra... Bir gece rüyasında Efendimizi gördü.
Efendimiz ona sitemle: "Bizi ziyaret etmeyecek misin ey Bilal? Bu ayrılık yetmedi mi?" dedi.

Bilal kan ter içinde uyandı. Hemen bineğine atladı, günlerce yol gidip Medine'ye vardı. Peygamberimizin kabrine kapandı, saatlerce ağladı.

Hazreti Hasan ve Hüseyin, onu gördüler. "Ey Bilal!" dediler. "Dedemizin zamanındaki gibi, bir kez daha ezan okur musun? O günleri çok özledik..."

Bilal, Resulullah'ın torunlarını kıramadı.

Sabah namazı vakti... Mescid-i Nebevi'nin üzerine çıktı. Yıllar sonra o yanık ses, Medine semalarında tekrar duyuldu:

"Allahu Ekber!..."

Medine halkı yataklarından fırladı. "Resulullah mı dirildi?" diye sokaklara döküldüler. Kadınlar, erkekler, çocuklar... Herkes ağlıyordu.

Bilal "Eşhedü enne Muhammeden Resulullah" dediğinde... Medine'de yer yerinden oynadı. Sanki Peygamberimiz (s.a.v) mescide giriyormuş gibi bir manevi hava oluştu.

O gün Medine, Resulullah'ın vefatından sonra en çok gözyaşı dökülen günü yaşadı.

Bu hikaye bize şunu fısıldar:

Bir insanı yücelten; soyu, rengi veya parası değildir. İnsanı yücelten; taşların altında ezilirken bile "Allah" diyebilen imanıdır.

Ve gerçek sevgi... Sevdiğinin adını anarken nefessiz kalmaktır.

Allah bizlere, Bilal-i Habeşi'nin imanından ve Peygamber sevgisinden bir pay nasip etsin..`,duration:"6 dk",category:"Sahabeler",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fbilal-i-habesi.mp3?alt=media"}],moral:[{id:11,title:"Mevlana ve Şems",content:`Konya... 13. Yüzyıl.

Gönüller Sultanı Mevlana Celaleddin-i Rumi... Ve onun ruhunu tutuşturan o ilahi ateş: Şems-i Tebrizi.

Bu hikaye... sadece iki dostun hikayesi değildir. Bu; kitabın aşka, aklın kalbe ve "ben"liğin "biz"liğe dönüşmesinin destanıdır.

Mevlana, o dönemde Konya'nın en büyük alimiydi. Binlerce talebesi vardı. Kürsüye çıktığında herkes susar, onun ilmini dinlerdi. O bir okyanustu... ama durgun bir okyanustu. Dalgalanması için, bir fırtınaya ihtiyacı vardı.

İşte o fırtına... Şems-i Tebrizi adında, üstü başı tozlu, garip bir dervişti.

Şems, diyar diyar dolaşıyor, "Allah'ım! Beni kendi velilerinle tanıştır, içimdeki bu yangını kaldırabilecek bir dost ver" diye dua ediyordu. Ve rüyasında ona "Rum diyarına git" dendi.

O gün... İki denizin kavuştuğu gündü (Merac'el Bahreyn).

Mevlana, katırının üzerinde, talebeleriyle birlikte çarşıdan geçiyordu. Herkes el pençe divan duruyordu. Aniden, o siyah giysili derviş, Şems, katırın dizginlerine yapıştı. Mevlana'nın gözlerinin içine baktı ve o meşhur soruyu sordu:

"Ey Müftülerin Efendisi! Söyle bana... Hazreti Muhammed mi büyüktür, yoksa Bayezid-i Bistami mi?"

Mevlana dehşete düştü. "Bu nasıl sorudur?" dedi. "Kainatın Efendisi ile bir veli kıyaslanır mı? Elbette Hazreti Muhammed büyüktür!"

Şems gülümsedi ve dedi ki:
"Öyleyse neden Peygamber 'Ya Rabbi, seni hakkıyla bilemedim' derken... Bayezid 'Kendimi tesbih ederim, şanım ne yücedir' dedi? Biri acziyetini itiraf etti, diğeri ise kendindeki ilahi tecelliye dayanamayıp taştı."

Bu cevap... Mevlana'nın aklındaki tüm kitapları yaktı. O an anladı ki; Peygamberimiz o kadar büyük bir okyanustu ki, ne kadar içerse içsin susuzluğu bitmiyordu. Bayezid ise bir bardak suyla sarhoş olmuştu.

Mevlana, attan indi. Şems'in dizinin dibine çöktü. Ve o günden sonra, o koca müderris sustu... Gönül adamı konuşmaya başladı.

Aylarca bir odaya kapandılar. Sadece Allah'ı, aşkı ve hakikati konuştular. Mevlana, kitapların satırlarından çıkıp, gönlün satırlarını okumaya başladı.

Şems ona dedi ki:
"Alimsin, ama aşık değilsin... Bilmek başka, olmak başkadır. Yanmadıkça, olamazsın."

Mevlana yandı... Kül oldu. Artık kürsülerde vaaz vermiyor, sema dönüyor, şiirler okuyordu.

Ancak... Halk dedikoduya başladı. "Bu derviş geldi, hocamızın aklını çeldi" dediler. Şems'e kin beslediler.

Şems, Mevlana'nın daha fazla zor durumda kalmaması için... bir gece ansızın çekip gitti.

Mevlana perişan oldu. "Etme!" diye şiirler yazdı.
"Duydum ki bizi bırakmaya azmediyorsun, etme.
Başka bir yar, başka bir dosta meylediyorsun, etme..."

Oğlu Sultan Veled'i Şam'a gönderdi, Şems'i buldurup geri getirtti. Ama haset ateşi sönmemişti. Ve bir gece... Şems, o kapıdan çıktı ve bir daha geri dönmedi. Kimi şehit edildi dedi, kimi sır oldu dedi.

Mevlana, Şems'i her yerde aradı. Şam sokaklarında, Konya pazarlarında...
"Şems'i gördüm" diyene üzerindeki hırkasını verdi. "Yalan söylüyor" dediklerinde ise; "Ben onun yalanına hırkamı verdim, doğrusuna canımı verirdim" dedi.

Ve sonunda... Mevlana aradığını buldu. Ama dışarıda değil, kendi içinde.

Anladı ki Şems bir aynaydı. O aynada gördüğü nur, aslında kendi ruhuydu. Şems gitmişti ama Mevlana'yı "Mevlana" yapmıştı.

O, bu ayrılık acısıyla Mesnevi'yi yazmaya başladı. 26 bin beyitlik o şaheser, Şems'in yokluğunda, aşkın varlığıyla döküldü dudaklarından.

Ve hayatını üç kelimeyle özetledi:
"Hamdım... Piştim... Yandım."

Hamdı; kitapları vardı. Pişti; Şems ile tanıştı. Yandı; Şems gidince aşkın ateşinde kül oldu.

Bu hikaye bize şunu fısıldar:

Aşk; birine kavuşmak değil... Kendini onda kaybedip, Allah'ta bulmaktır.
Ve bazen, en büyük vuslatlar (kavuşmalar), ayrılıkların içinde gizlidir.

Allah bizlere, Mevlana'nın o engin gönlünden ve Şems'in o yakıcı aşkından bir kıvılcım nasip etsin..`,duration:"5 dk",category:"Kıssalar",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fmevlana-ve-sems.mp3?alt=media"},{id:12,title:"Behlül Dane'nin Sarayı",content:`Bağdat sokakları... İslam'ın altın çağı.

Bir yanda dünyanın en kudretli hükümdarı, Halife Harun Reşid... Diğer yanda ise üstü başı toz içinde, ama kalbi pırıl pırıl bir derviş: Behlül Dânâ.

İnsanlar ona "Deli" derdi... Ama o, akıllıların bile çözemediği sırra ermiş bir veliydi.

Bir gün... Halife Harun Reşid ve eşi Zübeyde Hanım, sarayın bahçesinde dolaşıyorlardı. Uzakta, nehir kenarında Behlül'ü gördüler. Behlül, yere oturmuş, ıslak çamurlarla oynuyor, küçük küçük evler, kubbeler yapıyordu.

Harun Reşid gülümsedi, yanına yaklaştı ve sordu:
"Ey Behlül! Yine ne yapıyorsun böyle çamur içinde?"

Behlül başını kaldırmadan, ciddi bir tavırla cevap verdi:
"Cennet sarayları yapıyorum ey Halife... Görmüyor musun?"

Halife kahkaha attı. "Demek Cennet sarayları... Peki, kaça satıyorsun bu sarayları?"

Behlül: "Çok ucuz" dedi. "Tanesi sadece bir dinar."

Harun Reşid, bunun bir delinin oyunu olduğunu düşündü. "Çamurdan bir yığın için para mı verilir?" diye içinden geçirdi ve alaycı bir tavırla yürümeye devam etti.

Ancak eşi Zübeyde Hanım... O, Behlül'ün gözlerindeki derinliği fark etmişti. Çantasından bir dinar çıkardı ve Behlül'e uzattı:
"Al ey Behlül... Ben satın alıyorum o sarayı. İşte paran."

Behlül parayı aldı, nehre fırlattı ve "Sattım gitti! Hayrını gör" dedi. Harun Reşid ise eşine dönüp: "Paranı sokağa attın, bir delinin oyununa geldin" dedi.

O gece...

Harun Reşid rüyasında kendini Cennet'te gördü. Öyle muazzam köşkler, öyle ihtişamlı saraylar vardı ki, dünyadaki sarayı onların yanında bir kulübe gibi kalırdı.

Hayranlıkla gezerken, altından yapılmış, yakutlarla süslü muhteşem bir sarayın önünde durdu. Kapısında yeşil harflerle bir isim yazılıydı: "Zübeyde'nin Sarayı."

Harun Reşid heyecanlandı. "Bu benim hanımın sarayı ise, ben de girebilirim" diyerek kapıya yöneldi.

Ama kapıdaki heybetli muhafız onu durdurdu:
"Dur ey Harun! Giremezsin."

Harun Reşid şaşırdı: "Ama o benim eşimdir! Onun olan benim de sayılır."

Muhafız gürledi:
"Hayır! O, bu sarayı dünyadayken satın aldı. Sen ise gülüp geçtin. Bedelini ödemediğin yere giremezsin!"

Harun Reşid kan ter içinde, büyük bir pişmanlıkla uyandı. Sabah ezanı okunuyordu ama onun kulağında hala o söz çınlıyordu: "Bedelini ödemediğin yere giremezsin."

Sabahın ilk ışıklarıyla hemen saraydan çıktı, Behlül'ü aramaya koyuldu. Onu yine aynı yerde, çamurlarla oynarken buldu.

Harun Reşid hemen yanına çöktü. Nefes nefese:
"Ey Behlül! Dün sattığın o saraylardan bana da yap. Kaç paraysa vereceğim. İster yüz dinar, ister bin dinar... Söyle fiyatını!"

Behlül Dânâ, elindeki çamuru yavaşça düzeltti. Halifenin yüzüne o meşhur, o hikmet dolu bakışını fırlattı ve tarihe geçen şu cevabı verdi:

"Geç kaldın ey Harun..."

Harun Reşid yalvarırcasına sordu: "Neden? Dün bir dinardı, bugün paran mı yetmiyor?"

Behlül başını iki yana salladı ve dedi ki:

"Dün... Sen o sarayı görmeden, sadece Allah rızası için, bir garibi sevindirmek için alacaktın. O yüzden fiyatı bir dinardı.

Ama bugün... Sen rüyayı gördün. Malı gördükten sonra herkes müşteri olur. Artık o sarayın fiyatı, senin bütün krallığın bile olsa yetmez."

Harun Reşid olduğu yere yığıldı kaldı. Anladı ki; mesele çamurdan evler değildi. Mesele; "Gayba" (görünmeyene) iman edip, nefsi yenerek elini cebine atabilmekti.

Bu kıssa bize şunu fısıldar:

Gerçek akıllılık; herkesin "çamur" dediğine, "Cennet tohumu" gözüyle bakabilmektir.
Ve cennet; onu rüyasında görenlerin değil, uyanıkken fedakarlık yapanların yurdudur.

Unutma... Eseri gördükten sonra herkes inanır. Marifet; henüz ortada eser yokken, sırf Ustası (c.c.) hatırına bedel ödemektir.

Allah bizlere, Zübeyde annemizin teslimiyetinden ve Behlül'ün ferasetinden bir pay nasip etsin..`,duration:"5 dk",category:"Kıssalar",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fbehlul-dane.mp3?alt=media"},{id:13,title:"Kuşlar ve Tevekkül",content:`Medine'nin o bereketli sabahlarından biriydi...

Güneş, hurma bahçelerinin üzerine yeni doğmuş, yapraklar hafif bir rüzgarla salınıyordu. Mescid-i Nebevi'nin avlusunda, bir grup sahabi, Peygamber Efendimizin etrafında toplanmışlardı.

Yüzlerinde, bugün bizim de çok iyi bildiğimiz o dünya telaşı'nın izleri vardı.

Kimi borcundan, kimi tarlasının verimsizliğinden, kimi çocuklarının geleceğinden bahsediyordu. Yarın ne yiyeceğiz? Kış geliyor, ne yapacağız? Rızkımız nereden gelecek? diye fısıldaşıyorlardı.

İnsanlık hali işte... Asırlar değişse de, dertler değişmiyordu. Kalpler, gelecek korkusuyla sıkışmıştı.

Kainatın Efendisi, onların bu halini gördü. Tebessüm etti. O an, gökyüzünde süzülen, özgürce kanat çırpan kuşları işaret etti. Ve kıyamete kadar tüm insanlığın yüreğine su serpecek, o muazzam reçeteyi verdi:

Eğer siz... Allah'a hakkıyla tevekkül etseydiniz, O'na tam güvenseydiniz... O, sabah yuvalarından kursakları bomboş çıkıp, akşam karınları tok ve dolu dönen kuşları rızıklandırdığı gibi, sizi de rızıklandırırdı.

Bu söz... sadece bir teselli değil, hayatın en büyük matematik formülüydü.

Gel seninle bir kuşun hayatına bakalım...

Bir serçe sabah uyanır. Yuvasından başını uzattığında, ne bankada birikmiş parası vardır, ne de akşamdan sakladığı bir yiyeceği. Ne buzdolabı vardır, ne de ay sonu maaşım yatacak diye bir garantisi.

Kursakları bomboştur. Açtır. Yavruları da açtır.

Ama o kuş, yuvasının kenarına konar. Kanatlarını açar ve kendini boşluğa bırakır. Acaba bugün aç kalır mıyım? diye düşünmez. Hava bugün rüzgarlı, ya rızkımı bulamazsam? diye depresyona girmez.

Sadece uçar... Rabbim beni yarattıysa, elbet rızkımı da yaratmıştır dercesine, gökyüzüne teslim olur.

O kuş, rızkın peşine düşer. Bir ağacın dalına konar, bir evin avlusuna iner. Ve mucize gerçekleşir...

Koca kainatın sahibi olan Allah, o küçücük kuşu unutmaz. Onun rızkını, bazen bir böcek olarak yaprağın altına, bazen bir ekmek kırıntısı olarak yolun kenarına koyar.

Ve güneş batıp da akşam olduğunda... O sabah aç çıkan kuş, yuvasına mutlaka tok döner. Hem kendi doymuştur, hem de yavrularını doyuracak rızkı getirmiştir.

Peki ya biz? Ey Eşref-i Mahlukat, yaratılmışların en şereflisi olan insan...

Senin aklın var, diploman var, mesleğin var, evinde yiyeceğin var... Ama kuşlardan daha çok korkuyorsun. Yarın ne olacak? diye uykuların kaçıyor.

Neden biliyor musun?

Çünkü kuşlar, rızkı vereni tanıyor. Biz ise, rızkı kendi çabamızdan, patronumuzdan veya müşterimizden biliyoruz.

Tevekkül; hiç çalışmadan oturmak değildir. Dikkat et! Hadiste Peygamberimiz, kuşlar yuvada oturur, Allah ağızlarına koyar demedi.
Sabah çıkarlar dedi. Yani kuş bile rızkını bulmak için kanat çırpar, yuvasından çıkar, gayret eder.

Tevekkül şudur: Sen sabah kalkacaksın. İşine gideceksin, dükkanını açacaksın, tarlanı süreceksin. Yani kanat çırpacaksın!
Ama sonucu... Rızkı verene bırakacaksın.

Ben elimden geleni yaptım. Gerisi, kuşları doyuran Rabbime aittir diyebilmektir tevekkül.

Hani bazen daralırsın... Kapılar yüzüne kapanır... Borçlar dağ gibi olur... Bitti, artık çare yok, mahvoldum dersin ya...

İşte o an, pencerenin önüne konan o minik kuşu hatırla.

Ona rızkını veren, onu havada tutan Allah; senin de sahibindir. Dağın altındaki karıncayı doyuran, denizin dibindeki balığı unutmayan Rabbin, seni asla, ama asla aç ve açıkta bırakmaz.

Senin rızkın, sen daha annenin karnındayken ayrıldı. Ecelin gelmeden, son lokmanı yemeden, bu dünyadan göçmeyeceksin.

Öyleyse bugün derin bir nefes al. Omuzlarındaki o ağır gelecek kaygısı yükünü yere bırak. Alnını secdeye, kalbini Rabbine yasla. Ve gökyüzüne bakıp, Hazreti İbrahim'in ateşe atılırken söylediği o güven dolu sözü söyle:

Hasbunallah ve nimel vekil...
Allah bana yeter... O ne güzel vekildir.

Unutma... Gökyüzünde Rızık Ofisi yoktur ama hiçbir kuş aç kalmaz. Yeryüzünde Garanti Belgesi yoktur ama Allah'a güvenen yolda kalmaz.

Çünkü O... her şeye yetendir..`,duration:"5 dk",category:"Kıssalar",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fkuslar-ve-tevekkul.mp3?alt=media"},{id:14,title:"Bir Damla Bal",content:`Zamanın birinde... Bir yolcu, ıssız ve uçsuz bucaksız bir sahrada yürüyordu.

Güneş tepede, kumlar ateş gibi yanıyordu. Yolcu yorgundu, susuzdu ama yürümeye devam ediyordu.

Birden... Arkasından korkunç bir kükreme duydu. Dönüp baktığında, dehşet verici, yırtıcı bir aslanın kendisine doğru son sürat koştuğunu gördü. Aslanın gözlerinden ateş fışkırıyor, pençeleri ölümü çağırıyordu.

Yolcu, korkuyla kaçmaya başladı. Nefes nefese koşarken, önünde kurumuş, derin bir kuyu gördü. Başka çaresi yoktu... Kendini o kör kuyuya attı.

Düşerken... Kuyunun duvarında bitmiş bir ağacın dalına tutundu. Bedeni boşlukta sallanıyordu ama derin bir nefes aldı. Aslandan kurtulmuştu.

Ancak... Gözleri aşağıya kaydığında, kanı dondu.

Kuyunun dibinde, ağzını kocaman açmış, onu yutmak için bekleyen devasa bir ejderha vardı. Ejderha, başını yukarı kaldırmış, avının düşmesini bekliyordu.

Yolcu dehşet içinde başını yukarı kaldırdı. Kuyunun ağzında o aslan hala bekliyordu.

Aşağıda ejderha... Yukarıda aslan... Ortada ise, tutunduğu o cılız ağaç dalı.

Tam "En azından bu dal beni taşır" diye düşünürken... Dalın kökünde bir kıpırtı gördü. Biri siyah, diğeri beyaz iki farenin, o tutunduğu dalı kemirmekte olduğunu fark etti.

Kırt... Kırt... Kırt...

Siyah fare ve beyaz fare, nöbetleşe çalışıyor, dalı her an kopacak hale getiriyordu.

Yolcunun durumu ümitsizdi. Yukarıda aslan, aşağıda ejderha, yanında dalı kemiren fareler... Ölüm, her yerden onu kuşatmıştı. Kaçış yoktu.

İşte tam o sırada...

Yolcu, tutunduğu dalın ucunda, arıların yaptığı küçük bir bal peteği gördü. O petekten, ağacın yaprağına sızmış, parlayan bir damla bal...

Ve insanı hayrete düşüren o gaflet anı yaşandı.

O yolcu... Yukarıdaki aslanı unuttu. Aşağıdaki ejderhayı unuttu. Dalını kemiren o iki fareyi unuttu.

Dilini uzattı ve o bir damla balı yalamaya başladı.

Bal o kadar tatlıydı ki... O lezzetin sarhoşluğuyla, nerede olduğunu, birazdan o dalın kopacağını ve ejderhanın ağzına düşeceğini tamamen aklından çıkardı. Sadece o balın tadına odaklandı. Ta ki... Dal kopup, karanlığa düşene kadar.

Ey bu hikayeyi dinleyen kardeşim...

Bu hikayedeki o yolcu... Sensin. Benim. Hepimiziz.

O ıssız sahra... Şu dünya hayatıdır.

O peşindeki aslan... Her an ensende olan, kaçışı olmayan Eceldir. Nereye gidersen git, seni bulacaktır.

O tutunduğun ağaç... Senin ömründür.

O ağacı kemiren siyah ve beyaz fare... Gece ve gündüzdür. Durmaksızın ömrünü tüketmekte, seni sona yaklaştırmaktadırlar.

Aşağıdaki o ejderha... Kabir kapısıdır. Gafletle yaşayanlar için dehşet verici bir çukur, uyanık olanlar için ise bir kapıdır.

Ve o bir damla bal...

İşte o, dünyanın geçici lezzetleridir. Harama bulaşmış zevkler, bitmeyecek sanılan makamlar, tükenmeyecek sanılan paralardır.

Bizler, o bir damla zehirli balın tadına aldanıp; ölümü, hesabı ve ahireti unuttuk. Sanki hiç ölmeyecekmiş gibi, sanki o dal hiç kopmayacakmış gibi o bala daldık.

Oysa fareler çalışıyor... Günler ve geceler, ömür dalımızı kemiriyor. Aslan bekliyor. Ve ejderha ağzını açmış, misafirini gözlüyor.

Hala o balı mı düşüneceksin? Yoksa başını kaldırıp, seni bu kuyudan çıkaracak, seni o aslanın ve ejderhanın şerrinden koruyacak olan Rabbine mi sığınacaksın?

Akıllı insan... Balın tadına aldanıp zehirlenen değil; o kuyu sahibini tanıyıp, O'na dua edendir.

Çünkü O'na sığınırsan... Aslan uysal bir binek, ejderha rahmet kapısı, o kuyu ise cennet bahçesine açılan bir tünel olur.

Seçim senin... Bir damla bal mı? Yoksa ebedi bir bal ırmağı mı?

Uyan ey yolcu... Dal kopmadan, uyan.`,duration:"5 dk",category:"Kıssalar",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fbir-damla-bal.mp3?alt=media"},{id:15,title:"Gül ve Diken",content:`Vaktiyle, şehrin kenarında, kokusu yedi mahalleye yayılan, görenleri hayran bırakan dillere destan bir gül bahçesi vardı.

Bu bahçenin sahibi, nur yüzlü, beli bükülmüş, ömrünü toprağa vermiş ihtiyar bir bahçıvandı. Bir de onun yanında çalışan, genç, tezcanlı ve sabırsız bir çırağı vardı.

Bir sabah, çırak erkenden bahçeye girdi. En nadide, en kırmızı güllerin olduğu bölüme gitti. Niyeti, o gülleri toplayıp efendisine götürmekti.

Elini, üzerinde sabah çiyinin parladığı o muazzam güle uzattı. Tam koparacakken... eline sivri bir diken battı.

Genç çırak, acıyla elini çekti. Parmağından kan damlıyordu. Canının acısıyla öfkelendi. Eline bir makas aldı ve kendi kendine söylenmeye başladı:

Bu ne saçmalık! Böyle cennet gibi bir güzelliğin yanında, bu can yakan dikenlerin ne işi var? Bu dikenler hatadır, kusurdur! Ben bugün bu bahçedeki bütün dikenleri keseceğim. Güller, dikensiz ve kusursuz olmalı.

Hırsla işe koyuldu. Güllerin gövdesindeki bütün dikenleri teker teker, acımasızca kesti, budadı.

Akşam olduğunda, ihtiyar bahçıvan bahçeye geldi. Bir de ne görsün? O dimdik duran güllerin boynu bükülmüş, yaprakları solmaya yüz tutmuştu.

İhtiyar, hüzünle çırağına döndü:
Evlat... Sen ne yaptın bu güllere?

Çırak, yaptığı işten gurur duyarak cevap verdi:
Efendim, onları temizledim! O çirkin, o can yakan dikenlerden kurtardım hepsini. Artık sadece güzellik kaldı, acı yok.

İhtiyar bahçıvan derin bir iç çekti. Gözleri doldu. Ve o genç çırağa, hayatı boyunca unutamayacağı şu dersi verdi:

Ey evlat... Sen iyilik yaptığını sanmışsın ama aslında güle en büyük kötülüğü yapmışsın.

O kestiğin dikenler, gülün düşmanı değil, muhafızıydı. O dikenler sayesinde, böcekler o narin gövdeye tırmanamaz, yaban hayvanları o gülü yiyemezdi. Diken, gülün kalkanıydı.

Sen kalkanı kaldırınca, savunmasız kalan gül, korkudan boynunu büktü. Suyunu çekemedi, özünü kaybetti.

Sonra ihtiyar, bastonuna dayanarak doğruldu ve şöyle devam etti:

Unutma evlat... Bu dünyada dikensiz gül olmaz.

Gül; vuslattır, kavuşmaktır, güzelliktir.
Diken ise; o yolda çekilen çiledir, sabırdır, imtihandır.

Sen dikenin acısına katlanmadan, gülün kokusuna layık olamazsın. Diken batıyor diye şikayet etme. Bil ki o diken, seni gaflet uykusundan uyandırmak için batar.

Bülbülün sesi, güle olan aşkından değil, dikenin verdiği acıdandır. O acı olmasa, o aşk destan olur mu?

Genç çırak, o gün başını öne eğdi. Anladı ki; hayatındaki zorlukları, dertleri ve sıkıntıları kesip atmak, aslında ruhunu soldurmak demekti.

Ey bu hikayeyi dinleyen kardeşim...

Senin hayat bahçende de dikenler var, biliyorum.

Belki bir hastalık, belki bir borç, belki vefasız bir dost, belki de gerçekleşmeyen bir hayal... Canını yakıyor, kanatıyor. Neden ben? diye soruyorsun. Keşke hayatım dikensiz, dümdüz bir yol olsaydı diyorsun.

Deme.

O dikenler, senin manevi gülünü koruyan muhafızlardır. O dertler, seni Allah'a yaklaştıran, seni pişiren, seni olgunlaştıran vesilelerdir.

Eğer hayatında hiç zorluk olmasaydı, sabrın tadını nasıl bilecektin? Eğer hiç düşmeseydin, kalkmanın kıymetini nasıl anlayacaktın?

Hazreti Yusuf, kuyuya atılmasaydı, Mısır'a sultan olabilir miydi?
Hazreti Yakup, evlat hasretiyle yanmasaydı, o vuslatın kokusunu alabilir miydi?

Hepsi birer dikendi... Ama sonu, muazzam bir gül bahçesiydi.

O yüzden... Bugün eline batan dikene kızma. O dikeni verene dön ve şükret.

Çünkü Allah, sevdiği kulunun eline diken batırır ki; o kul, gülün kokusunu daha derin içine çeksin.

Sabret... Dikenin acısı geçer ama gülün kokusu ebedidir.

Ve unutma; en güzel güller, en keskin dikenlerin arasından yükselir..`,duration:"5 dk",category:"Kıssalar",audioUrl:"https://firebasestorage.googleapis.com/v0/b/islami-yoldas-app.firebasestorage.app/o/audio%2Fgul-ve-diken.mp3?alt=media"}]},me={prophets:[{id:1,title:"Die Geduld des Propheten Yusuf",content:`Im Land Kanaan, wo die Sterne nachts am hellsten leuchteten, hatte der Prophet Yakub zwölf Söhne. Doch einer von ihnen unterschied sich durch das Licht auf seinem Gesicht und die Reinheit in seinem Herzen von den anderen: Yusuf...

Als er noch ein kleines Kind war, sah er jenen Traum, der sein Schicksal ankündigte. Er lief zu seinem Vater und sagte: "Vater! In meinem Traum sah ich elf Sterne, die Sonne und den Mond sich vor mir niederwerfen."

Hz. Yakub erkannte, dass dies eine große Prophezeiung war; aber gleichzeitig fürchtete er den Zorn der eifersüchtigen Brüder. "Mein Kind", sagte er, "erzähle deinen Traum auf keinen Fall deinen Brüdern..."

Doch das Schicksal hatte bereits begonnen, sein Netz zu weben. Das Feuer der Eifersucht, das in die Herzen der Brüder fiel, trieb sie zu einem schrecklichen Plan. Eines Tages baten sie ihren Vater um Erlaubnis, Yusuf unter dem Vorwand eines Ausflugs aufs Feld mitzunehmen. Und sie warfen das unschuldige Kind in einen dunklen Brunnen in der einsamen Wüste.

Yusuf war auf dem Grund des Brunnens. Es war dunkel, kalt und er war allein. Aber er suchte mit seinem kleinen Herzen Zuflucht bei seinem Herrn. Allah offenbarte ihm auf dem Grund des Brunnens: "Fürchte dich nicht, Yusuf... Der Tag wird kommen, an dem du ihnen ihre Tat vorhalten wirst, ohne dass sie es merken."

Die Brüder befleckten Yusufs Hemd mit Wolfsblut und brachten es ihrem Vater. Als der Prophet Yakub das blutige Hemd in die Hand nahm, bemerkte er, dass es nicht zerrissen war. Würde ein Wolf einen Menschen verschlingen und das Hemd unversehrt lassen? Obwohl sein Herz brannte und die Tränen aus seinen Augen strömten, sagte er: "Nun bleibt mir nur eine schöne Geduld..."

... ... ...

Eine Karawane, die am Brunnen vorbeikam, ließ ihren Eimer hinunter, um Wasser zu schöpfen. Als der Eimer hochgezogen wurde, fanden sie statt Wasser ein wunderschönes Kind. Sie nahmen Yusuf mit und verkauften ihn auf dem Sklavenmarkt Ägyptens für einen geringen Preis.

Yusuf war nun ein Sklave im Palast des Aziz von Ägypten. Aber Allah gab ihm Wissen und Weisheit und verschönerte ihn. Mit der Zeit wuchs er im Palast heran. Doch die Prüfung war nicht vorbei. Die nächste Prüfung war tiefer als der Brunnen, dunkler als das Gefängnis: Verleumdung.

Yusuf, der das Angebot der Palastherrin Zulaikha mit den Worten "Ich suche Zuflucht bei Allah" ablehnte, wurde wegen eines Verbrechens, das er nicht begangen hatte, ins Gefängnis geworfen. Das Gefängnis... Für manche eine Endstation, für Yusuf eine Schule. Er blieb dort jahrelang. Anstatt seine Unschuld herauszuschreien, vertraute er auf Allah und wartete. Er deutete dort seinen Mitgefangenen ihre Träume und verkündete die Wahrheit. Obwohl die Jahre lang genug waren, um den Stein der Geduld zu spalten, stand Yusufs Glaube aufrecht.

Und eines Nachts... sah der König von Ägypten einen Traum. Sieben magere Kühe fraßen sieben fette Kühe. Niemand konnte diesen Traum deuten. In diesem Moment erinnerte man sich an Yusuf im Gefängnis. Yusuf wurde aus dem Gefängnis geholt, deutete den Traum und warnte vor den bevorstehenden Hungerjahren.

Allahs Plan funktionierte makellos. Der Sklave im Brunnen, der Gefangene im Kerker; war nun der mächtigste Wesir Ägyptens geworden.

Jahre später, als die Hungersnot ausbrach, waren unter denen, die aus Kanaan kamen, um Vorräte zu holen, auch Yusufs Brüder. Sie erkannten ihn nicht. Aber Yusuf erkannte sie. Er empfand ihnen gegenüber weder Zorn noch Rache. Mit der großen Vergebung, die die Frucht seiner Geduld war, gab er ihnen sein Hemd und sagte: "Nehmt dieses Hemd und legt es auf das Gesicht meines Vaters. Seine Augen werden sich öffnen."

In Kanaan, als der Wind den Duft Yusufs brachte, richtete sich der Prophet Yakub auf: "Wenn ihr mich nicht für senil haltet, ich rieche den Duft Yusufs", sagte er. Als das Hemd auf sein Gesicht gelegt wurde, öffneten sich seine Augen, und die Trauer machte der Wiedersehensfreude Platz.

Als der Prophet Yusuf seine Eltern auf seinen Thron setzte, hatte sich der Traum seiner Kindheit erfüllt. Sonne, Mond und elf Sterne waren in seiner Gegenwart.

Das Geheimnis des Weges von der Dunkelheit des Brunnens zum Sultanat Ägyptens war ein einziges Wort: Geduld. Hz. Yusuf lehrte uns, dass das Fallen manchmal der erste Schritt zum Aufstieg ist. Und Allah ist mit den Geduldigen.`,duration:"5 Min",category:"Propheten",audioUrl:"/audio/hz-yusuf.mp3"},{id:2,title:"Die Heilung des Propheten Ayyub",content:"Trotz seiner jahrelangen Krankheit sagte das Denkmal der Geduld: 'Wahrlich, mich hat das Leid berührt, und Du bist der Barmherzigste der Barmherzigen'...",duration:"4 Min",category:"Propheten"},{id:3,title:"Ibrahim und das Feuer",content:"Der Sultan des Gottvertrauens, der beim Wurf ins Feuer des Nimrod sagte: 'Allah genügt uns, und Er ist der beste Beschützer'...",duration:"6 Min",category:"Propheten"},{id:4,title:"Musa und das Meer",content:"Kalimullah, der mit seinem Glauben einen Weg öffnete, als Pharaos Armee hinter ihm und das Meer vor ihm war...",duration:"7 Min",category:"Propheten"},{id:5,title:"Die Arche Noahs",content:"Jahrelange Einladung zum Glauben und die darauffolgende große Flut, die Wiedergeburt einer Generation...",duration:"8 Min",category:"Propheten"}],companions:[{id:6,title:"Abu Bakrs Treue",content:"Der größte Zeuge des Rufs 'Sorge dich nicht, Allah ist mit uns' in der Höhle...",duration:"4 Min",category:"Gefährten"},{id:7,title:"Umars Gerechtigkeit",content:"Das Sinnbild der Gerechtigkeit, der sagte: 'Wenn ein Wolf am Euphrat ein Schaf reißt, wird Umar zur Rechenschaft gezogen'...",duration:"5 Min",category:"Gefährten"},{id:8,title:"Uthmans Bescheidenheit",content:"Dhun-Nurain, der Liebhaber des Korans, vor dem selbst die Engel sich schämten...",duration:"4 Min",category:"Gefährten"},{id:9,title:"Alis Wissen",content:"Das Tor zur Stadt des Wissens, das mutige und weisheitsvolle Leben von Haydar-i Karrar...",duration:"6 Min",category:"Gefährten"},{id:10,title:"Bilals Gebetsruf",content:"Der Kampf um Freiheit und Glauben, der auf brennendem Sand mit dem Ruf 'Ahad' (Der Einzige) widerhallte...",duration:"5 Min",category:"Gefährten"}],moral:[{id:11,title:"Rumi und Schams",content:"Die Geschichte der göttlichen Liebesreise dessen, der sagte: 'Ich war roh, ich wurde gekocht, ich wurde verbrannt'...",duration:"5 Min",category:"Erzählungen"},{id:12,title:"Bahlul Danas Palast",content:"Die Weisheit eines Verrückten, der Herrschern die Vergänglichkeit des weltlichen Lebens lehrte...",duration:"4 Min",category:"Erzählungen"},{id:13,title:"Die Vögel und das Gottvertrauen",content:"Die Lektion über Versorgung und Gottvertrauen der Vögel, die morgens hungrig aufbrechen und abends satt zurückkehren...",duration:"3 Min",category:"Erzählungen"},{id:14,title:"Ein Tropfen Honig",content:"Die Parabel des Reisenden, der sich in die Freuden des irdischen Lebens verliert und die wahre Reise vergisst...",duration:"4 Min",category:"Erzählungen"},{id:15,title:"Die Rose und der Dorn",content:"Die Geschichte eines Gärtners über die Schwierigkeiten inmitten der Schönheiten und die Frucht der Geduld...",duration:"3 Min",category:"Erzählungen"}]},oe={prophets:[{id:1,title:"Терпение пророка Юсуфа",content:`В земле Ханаанской, где ночью звёзды сияли ярче всего, у пророка Якуба было двенадцать сыновей. Но один из них отличался светом на лице и чистотой сердца: Юсуф...

Ещё ребёнком он увидел тот сон, предвещавший его судьбу. Он побежал к отцу и сказал: «Отец! Во сне я видел одиннадцать звёзд, солнце и луну, склонившихся передо мной».

Якуб понял, что это великое пророчество; но в то же время боялся гнева завистливых братьев. «Дитя моё, — сказал он, — ни в коем случае не рассказывай свой сон братьям...»

Но судьба уже начала плести свою пряжу. Огонь зависти, упавший в сердца братьев, толкнул их на страшный план. Однажды они попросили у отца позволения взять Юсуфа на прогулку в поле. И бросили невинного ребёнка в тёмный колодец в безлюдной пустыне.

Юсуф был на дне колодца. Было темно, холодно и одиноко. Но маленьким сердцем он искал прибежища у Господа. Аллах открыл ему на дне колодца: «Не бойся, Юсуф... Придёт день, когда ты расскажешь им об их поступке, а они и не узнают тебя».

Братья испачкали рубашку Юсуфа волчьей кровью и принесли отцу. Когда пророк Якуб взял окровавленную рубашку, заметил, что она не разорвана. Разве волк проглотит человека, оставив рубашку целой? Хотя сердце его пылало и слёзы текли из глаз, он сказал: «Мне остаётся лишь прекрасное терпение...»

... ... ...

Караван, проходивший мимо колодца, опустил ведро за водой. Когда его подняли, вместо воды нашли прекрасное дитя. Они забрали Юсуфа и продали его на невольничьем рынке Египта за ничтожную цену.

Юсуф стал рабом во дворце египетского вельможи. Но Аллах даровал ему знание и мудрость и украсил его. Со временем он вырос во дворце. Но испытание не закончилось. Следующее было глубже колодца, темнее темницы: клевета.

Юсуф, отвергнувший предложение хозяйки дворца Зулейхи словами «Прибегаю к Аллаху», был брошен в темницу за преступление, которого не совершал. Темница... Для одних — тупик, для Юсуфа — школа. Он оставался там годами. Вместо того чтобы кричать о своей невиновности, он уповал на Аллаха и ждал. Там он толковал сны сокамерников и возвещал истину. Хотя годов было достаточно, чтобы расколоть камень терпения, вера Юсуфа стояла непоколебимо.

И однажды... царь Египта увидел сон. Семь тощих коров пожирали семь тучных коров. Никто не мог истолковать этот сон. Тогда вспомнили о Юсуфе в темнице. Юсуфа вывели, он истолковал сон и предупредил о грядущих голодных годах.

План Аллаха сработал безупречно. Раб из колодца, узник темницы — стал могущественнейшим визирем Египта.

Годы спустя, когда разразился голод, среди пришедших из Ханаана за припасами были и братья Юсуфа. Они не узнали его. Но Юсуф узнал их. Он не питал к ним ни гнева, ни мести. С великим прощением, плодом его терпения, он дал им свою рубашку и сказал: «Возьмите эту рубашку и положите на лицо моего отца. Его глаза откроются».

В Ханаане, когда ветер донёс аромат Юсуфа, пророк Якуб выпрямился: «Если не считаете меня выжившим из ума, я чую запах Юсуфа», — сказал он. Когда рубашку положили на его лицо, глаза его открылись, и печаль сменилась радостью встречи.

Когда пророк Юсуф усадил родителей на свой трон, сон его детства сбылся. Солнце, луна и одиннадцать звёзд были пред ним.

Тайна пути от тьмы колодца до султаната Египта заключалась в одном слове: терпение. Юсуф научил нас, что падение иногда — первый шаг к возвышению. И Аллах — с терпеливыми.`,duration:"5 мин",category:"Пророки",audioUrl:"/audio/hz-yusuf.mp3"},{id:2,title:"Исцеление пророка Аюба",content:"Символ терпения, который, несмотря на годы болезни, сказал: «Поистине, беда постигла меня, а Ты — Милосерднейший из милосердных»...",duration:"4 мин",category:"Пророки"},{id:3,title:"Ибрахим и огонь",content:"Султан упования, сказавший при броске в огонь Нимрода: «Достаточно нам Аллаха, Он — лучший Покровитель»...",duration:"6 мин",category:"Пророки"},{id:4,title:"Муса и море",content:"Калимуллах, который верой рассёк море, когда армия фараона была позади, а море — впереди...",duration:"7 мин",category:"Пророки"},{id:5,title:"Ковчег Нуха",content:"Долгие годы призыва к вере и последовавший великий потоп, перерождение поколения...",duration:"8 мин",category:"Пророки"}],companions:[{id:6,title:"Верность Абу Бакра",content:"Величайший свидетель слов «Не печалься, ведь Аллах — с нами» в пещере...",duration:"4 мин",category:"Сподвижники"},{id:7,title:"Справедливость Умара",content:"Символ справедливости, сказавший: «Если волк разорвёт овцу на берегу Евфрата, Умар за это ответит»...",duration:"5 мин",category:"Сподвижники"},{id:8,title:"Скромность Усмана",content:"Зун-Нурайн, возлюбивший Коран, перед которым стеснялись даже ангелы...",duration:"4 мин",category:"Сподвижники"},{id:9,title:"Знание Али",content:"Врата города знаний, отважная и мудрая жизнь Хайдар-и-Каррара...",duration:"6 мин",category:"Сподвижники"},{id:10,title:"Азан Биляля",content:"Борьба за свободу и веру, отозвавшаяся возгласом «Ахад» (Единственный) на раскалённом песке...",duration:"5 мин",category:"Сподвижники"}],moral:[{id:11,title:"Руми и Шамс",content:"История божественного путешествия любви того, кто сказал: «Я был сырым, я сварился, я сгорел»...",duration:"5 мин",category:"Притчи"},{id:12,title:"Дворец Бахлюля Дана",content:"Мудрость безумца, учившего правителей бренности мирской жизни...",duration:"4 мин",category:"Притчи"},{id:13,title:"Птицы и упование",content:"Урок о пропитании и уповании от птиц, которые улетают утром голодными и возвращаются вечером сытыми...",duration:"3 мин",category:"Притчи"},{id:14,title:"Капля мёда",content:"Притча о путнике, теряющемся в наслаждениях мирской жизни и забывающем истинное путешествие...",duration:"4 мин",category:"Притчи"},{id:15,title:"Роза и шип",content:"История садовника о трудностях среди красот и плоде терпения...",duration:"3 мин",category:"Притчи"}]},ye={prophets:[{id:1,title:"صبر النبي يوسف",content:`في أرض كنعان، حيث كانت النجوم تتلألأ في سمائها أشد ما تكون لمعاناً، كان للنبي يعقوب اثنا عشر ولداً. لكن واحداً منهم تميّز بالنور على وجهه والصفاء في قلبه: يوسف...

رأى وهو صغير ذلك الحلم الذي بشّر بقدره. ركض إلى أبيه وقال: "يا أبتِ إني رأيت أحد عشر كوكباً والشمس والقمر رأيتهم لي ساجدين."

أدرك يعقوب أن هذه نبوءة عظيمة، لكنه خشي حسد الإخوة. فقال: "يا بنيّ لا تقصص رؤياك على إخوتك..."

لكن القدر كان قد بدأ ينسج خيوطه. نار الحسد التي اشتعلت في قلوب الإخوة دفعتهم إلى مكيدة رهيبة. ذات يوم استأذنوا أباهم ليأخذوا يوسف في نزهة، وألقوا الطفل البريء في بئر مظلم في الصحراء الموحشة.

كان يوسف في قعر البئر. مظلم وبارد ووحيد. لكنه لجأ بقلبه الصغير إلى ربه. فأوحى الله إليه: "لا تخف يا يوسف... سيأتي يوم تُنبّئهم بأمرهم هذا وهم لا يشعرون."

لطّخ الإخوة قميص يوسف بدم ذئب وأتوا به لأبيهم. حين أمسك يعقوب بالقميص الملطخ لاحظ أنه لم يُمزَّق. أيأكل ذئب إنساناً ويترك قميصه سليماً؟ رغم أن قلبه يحترق والدموع تنهمر، قال: "فصبر جميل..."

... ... ...

مرّت قافلة بالبئر فأرسلوا دلوهم. حين رفعوه وجدوا طفلاً بديعاً بدلاً من الماء. أخذوا يوسف وباعوه في سوق العبيد بمصر بثمن بخس.

صار يوسف عبداً في قصر عزيز مصر. لكن الله آتاه علماً وحكمة وزيّنه. نشأ في القصر مع مرور الزمن. لكن الابتلاء لم ينتهِ. كانت المحنة التالية أعمق من البئر وأظلم من السجن: البهتان.

يوسف الذي ردّ عرض زليخا بقوله "معاذ الله" سُجن بذنب لم يرتكبه. السجن... للبعض نهاية، وليوسف مدرسة. مكث فيه سنوات. بدلاً من أن يصرخ ببراءته، توكل على الله وصبر. فسّر لرفاقه في السجن أحلامهم ونشر الحق. رغم أن السنين كانت كفيلة بفلق صخر الصبر، ظل إيمان يوسف قائماً.

وذات ليلة... رأى ملك مصر حلماً. سبع بقرات عجاف يأكلن سبع بقرات سمان. لم يستطع أحد تأويله. حينها تذكّروا يوسف في السجن. أُخرج يوسف وأوّل الحلم وحذّر من سنوات الجوع القادمة.

خطة الله تحققت بلا عيب. العبد في البئر، الأسير في السجن؛ صار أقوى وزير في مصر.

بعد سنوات، حين ضرب القحط، كان بين القادمين من كنعان لطلب المؤونة إخوة يوسف. لم يعرفوه. لكن يوسف عرفهم. لم يشعر نحوهم بغضب أو انتقام. بصفحه العظيم ثمرة صبره، أعطاهم قميصه وقال: "اذهبوا بقميصي هذا فألقوه على وجه أبي يأتِ بصيراً."

في كنعان، حين حملت الريح عبير يوسف، نهض يعقوب: "إني لأجد ريح يوسف لولا أن تفنّدون." وحين أُلقي القميص على وجهه ارتدّ بصيراً، وحلّ فرح اللقاء محل الحزن.

حين رفع يوسف أبويه على العرش، تحقق حلم طفولته. الشمس والقمر وأحد عشر كوكباً بين يديه.

سر الطريق من ظلمة البئر إلى عرش مصر كان كلمة واحدة: الصبر. علّمنا يوسف أن السقوط أحياناً هو الخطوة الأولى نحو الصعود. والله مع الصابرين.`,duration:"٥ دقائق",category:"الأنبياء",audioUrl:"/audio/hz-yusuf.mp3"},{id:2,title:"شفاء النبي أيوب",content:"رمز الصبر الذي رغم سنوات مرضه قال: 'أني مسّني الضر وأنت أرحم الراحمين'...",duration:"٤ دقائق",category:"الأنبياء"},{id:3,title:"إبراهيم والنار",content:"سلطان التوكل الذي قال حين أُلقي في نار النمرود: 'حسبنا الله ونعم الوكيل'...",duration:"٦ دقائق",category:"الأنبياء"},{id:4,title:"موسى والبحر",content:"كليم الله الذي شقّ طريقاً بإيمانه حين كان جيش فرعون خلفه والبحر أمامه...",duration:"٧ دقائق",category:"الأنبياء"},{id:5,title:"سفينة نوح",content:"سنوات من الدعوة إلى الإيمان ثم الطوفان العظيم وولادة جيل جديد...",duration:"٨ دقائق",category:"الأنبياء"}],companions:[{id:6,title:"وفاء أبي بكر",content:"أعظم شاهد على نداء 'لا تحزن إن الله معنا' في الغار...",duration:"٤ دقائق",category:"الصحابة"},{id:7,title:"عدل عمر",content:"رمز العدالة الذي قال: 'لو عثرت بغلة في العراق لخشيت أن يسألني الله عنها'...",duration:"٥ دقائق",category:"الصحابة"},{id:8,title:"حياء عثمان",content:"ذو النورين، محب القرآن الذي تستحي منه الملائكة...",duration:"٤ دقائق",category:"الصحابة"},{id:9,title:"علم علي",content:"باب مدينة العلم، حياة حيدر الكرّار المليئة بالشجاعة والحكمة...",duration:"٦ دقائق",category:"الصحابة"},{id:10,title:"أذان بلال",content:"نضال الحرية والإيمان الذي صدح فوق الرمال الحارقة بنداء 'أَحَد'...",duration:"٥ دقائق",category:"الصحابة"}],moral:[{id:11,title:"الرومي وشمس",content:"قصة رحلة العشق الإلهي لمن قال: 'كنت نيّئاً فنضجت فاحترقت'...",duration:"٥ دقائق",category:"أمثال"},{id:12,title:"قصر بهلول دانا",content:"حكمة المجنون الذي علّم الملوك فناء الحياة الدنيا...",duration:"٤ دقائق",category:"أمثال"},{id:13,title:"الطيور والتوكل",content:"درس الرزق والتوكل من الطيور التي تغدو خماصاً وتروح بطاناً...",duration:"٣ دقائق",category:"أمثال"},{id:14,title:"قطرة عسل",content:"مثل المسافر الذي أضاعه ملذات الدنيا عن الرحلة الحقيقية...",duration:"٤ دقائق",category:"أمثال"},{id:15,title:"الوردة والشوكة",content:"قصة بستاني عن الصعوبات وسط الجمال وثمرة الصبر...",duration:"٣ دقائق",category:"أمثال"}]},be={de:me,ru:oe,ar:ye},he=[{id:"prophets",icon:D},{id:"companions",icon:J},{id:"moral",icon:X}];function He(){const{t,i18n:l}=R("stories"),b=$(),z=(l.language||"en").split("-")[0],h={...ke,...be[z]||{}},[c,x]=s.useState("prophets"),[r,m]=s.useState(null),[v,o]=s.useState(!1),[y,d]=s.useState(0),[u,p]=s.useState(0),[A,w]=s.useState(1),[H,ce]=s.useState(!1),[ge,ze]=s.useState(!1),[B,M]=s.useState(!1),i=Y.useRef(null),O=te();Y.useEffect(()=>(r&&i.current&&(i.current.src=r.audioUrl||"",i.current.load(),i.current.volume=A,o(!1),d(0),M(!1)),()=>{i.current&&(i.current.pause(),i.current.src="",i.current.playbackRate=1)}),[r]);const P=()=>{!i.current||!r.audioUrl||(v?i.current.pause():i.current.play().catch(a=>console.error("Audio play failed",a)),o(!v))},V=()=>{i.current&&d(i.current.currentTime)},C=()=>{i.current&&p(i.current.duration)},T=()=>{o(!1),d(0),r&&N.storyCompleted(r.title,100)},F=a=>{const n=parseFloat(a.target.value);i.current&&(i.current.currentTime=n,d(n))},U=()=>{const a=h[c]||[],n=a.findIndex(k=>k.id===r.id);n!==-1&&n<a.length-1&&m(a[n+1])},_=()=>{const a=h[c]||[],n=a.findIndex(k=>k.id===r.id);n>0&&m(a[n-1])},I=()=>{if(i.current){const a=!B;i.current.playbackRate=a?2:1,M(a)}},K=a=>{if(isNaN(a))return"00:00";const n=Math.floor(a/60),k=Math.floor(a%60);return`${n.toString().padStart(2,"0")}:${k.toString().padStart(2,"0")}`};return e.jsxs("div",{className:"space-y-4 p-5 pb-24 dark:bg-[#032e18]",children:[e.jsx("div",{className:"glass-panel rounded-3xl p-2 grid grid-cols-3 gap-1",children:he.map(a=>{const n=a.icon,k=c===a.id;return e.jsxs(S.button,{onClick:()=>x(a.id),className:f("relative px-3 py-3 overflow-hidden rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",k?"bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg":"text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"),whileTap:{scale:.95},children:[e.jsx(n,{className:f("w-5 h-5 mx-auto mb-1",k&&"drop-shadow-md")}),e.jsx("span",{className:"text-[10px]",children:t(`categories.${a.id}`)})]},a.id)})}),e.jsx("div",{className:"grid gap-5",children:(h[c]||[]).map((a,n)=>{const E=!(n===0)&&!q();return e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:f(E&&"opacity-60"),children:e.jsx(ue,{story:a,onClick:()=>{if(E){b("/premium");return}m(a),N.storyStarted(a.title,a.duration||0)}})}),E&&e.jsxs("div",{className:"absolute top-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-islamic-gold to-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-islamic-gold/30",children:[e.jsx(Q,{size:10,fill:"white"})," Premium"]})]},a.id)})}),e.jsx(ee,{children:r&&e.jsx(S.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.2},className:"fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8",onClick:()=>m(null),children:e.jsxs(S.div,{drag:"y",dragControls:O,dragListener:!1,dragConstraints:{top:0,bottom:0},dragElastic:{top:0,bottom:.2},onDragEnd:(a,n)=>{(n.offset.y>100||n.velocity.y>500)&&m(null)},initial:{y:"100%",opacity:0,scale:.95},animate:{y:0,opacity:1,scale:1},exit:{y:"100%",opacity:0,scale:.95},transition:{type:"spring",damping:25,stiffness:300},className:"w-full max-w-[420px] h-full max-h-[90vh] bg-white dark:bg-[#032e18] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 ring-4 ring-black/20",onClick:a=>a.stopPropagation(),children:[e.jsxs("div",{className:"p-4 flex items-center justify-between border-b dark:border-white/10 bg-cream-bg/40 dark:bg-black/20 shrink-0 cursor-grab active:cursor-grabbing touch-none",onPointerDown:a=>O.start(a),children:[e.jsx(g,{variant:"ghost",size:"icon",onClick:()=>m(null),className:"rounded-full hover:bg-black/5 dark:hover:bg-white/5",children:e.jsx(ae,{className:"w-6 h-6 text-islamic-green dark:text-islamic-gold"})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"relative flex h-2 w-2",children:[e.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"}),e.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-red-500"})]}),e.jsx("span",{className:"text-[10px] font-bold text-gray-400 uppercase tracking-widest",children:t("nowListening")})]}),e.jsx("div",{className:"w-10 flex justify-center",children:e.jsx("div",{className:"w-8 h-1 bg-gray-300 dark:bg-white/20 rounded-full md:hidden opacity-50"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto px-5 py-6 no-scrollbar",children:[e.jsxs("div",{className:f("bg-gradient-to-br from-islamic-green to-[#033a1f] rounded-[2rem] p-6 mb-8 shadow-xl relative overflow-hidden group/card ring-1 ring-white/10 transition-transform duration-200",B&&"scale-[1.02] ring-islamic-gold/50"),children:[e.jsx("div",{className:"absolute top-4 right-4 z-20",children:e.jsx(g,{variant:"ghost",size:"sm",className:f("h-7 px-3 rounded-full font-bold text-[10px] transition-all border border-white/10 active:scale-95 select-none backdrop-blur-md",B?"bg-islamic-gold text-[#032e18] shadow-[0_0_15px_rgba(255,215,0,0.5)]":"bg-black/20 text-white/60 hover:text-white hover:bg-black/40"),onClick:I,children:t(B?"normalSpeed":"speedUp")})}),e.jsxs("div",{className:"relative z-10 flex flex-col items-center",children:[e.jsx("div",{className:"w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md shadow-inner border border-white/5",children:e.jsx(G,{className:"w-8 h-8 text-islamic-gold"})}),e.jsx("h1",{className:"text-xl font-serif font-bold text-white mb-6 text-center leading-tight",children:r.title}),e.jsx("audio",{ref:i,onTimeUpdate:V,onLoadedMetadata:C,onEnded:T}),e.jsxs("div",{className:"w-full flex items-center gap-3 mb-6",children:[e.jsx("span",{className:"text-[10px] font-mono text-white/60 w-8 text-right tabular-nums",children:K(y)}),e.jsxs("div",{className:"relative flex-1 h-6 flex items-center group/seek",children:[e.jsx("div",{className:"absolute inset-x-0 h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm",children:e.jsx("div",{className:"h-full bg-islamic-gold transition-all duration-100 ease-out",style:{width:`${y/u*100}%`}})}),e.jsx("div",{className:"absolute w-4 h-4 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none ring-2 ring-islamic-gold scale-100 group-active/seek:scale-110",style:{left:`${y/u*100}%`,transform:"translateX(-50%)"}}),e.jsx("input",{type:"range",min:"0",max:u||0,value:y,onChange:F,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"})]}),e.jsx("span",{className:"text-[10px] font-mono text-white/60 w-8 tabular-nums",children:K(u)})]}),e.jsxs("div",{className:"flex items-center justify-center gap-6 w-full relative mb-4",children:[e.jsx(g,{variant:"ghost",size:"icon",className:"text-white/40 hover:text-white hover:bg-white/10 rounded-full",onClick:_,children:e.jsx(ne,{className:"w-6 h-6 fill-current"})}),e.jsx(g,{onClick:P,className:"w-16 h-16 rounded-full bg-islamic-gold hover:bg-[#d6a549] hover:scale-105 active:scale-95 transition-all text-[#032e18] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] flex items-center justify-center p-0 ring-4 ring-black/10",children:v?e.jsxs("div",{className:"flex gap-1 h-5",children:[e.jsx("div",{className:"w-1.5 bg-[#032e18] rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]"}),e.jsx("div",{className:"w-1.5 bg-[#032e18] rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]"})]}):e.jsx(j,{className:"w-7 h-7 fill-current ml-1"})}),e.jsx(g,{variant:"ghost",size:"icon",className:"text-white/40 hover:text-white hover:bg-white/10 rounded-full",onClick:U,children:e.jsx(re,{className:"w-6 h-6 fill-current"})})]})]}),e.jsx("div",{className:"absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#033a1f]/80 to-transparent pointer-events-none"})]}),e.jsx("div",{className:"space-y-6",children:e.jsx("article",{className:"prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-serif px-1 pb-10",children:e.jsx("p",{className:"first-letter:text-4xl first-letter:font-bold first-letter:text-islamic-green dark:first-letter:text-islamic-gold first-letter:mr-2 first-letter:float-left whitespace-pre-wrap",children:r.content})})}),e.jsx("div",{className:"h-10"})]})]})})})]})}export{He as default};
