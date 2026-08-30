-- 10 книжных сказок. Миграция идемпотентна: агент выкатки прогоняет все
-- миграции при каждом деплое, поэтому повторный запуск не создаёт дублей.
-- Товары заводятся черновиками: публикуем после того, как в админке
-- нарисованы и утверждены образцы страниц.

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('night-lights', 'Ночные огоньки', 'Про страх темноты и про то, что свет всегда есть внутри', 'Когда гаснет свет, комната становится чужой, а в углу будто кто-то прячется. В этой сказке {имя} не заставляют перестать бояться. Вместо этого крошечный тёплый огонёк показывает: темнота не злая, она просто тихая. И к концу истории ребёнок сам протягивает руку туда, куда только что боялся смотреть.

Это главный вечерний сюжет для тех, кто просит не выключать свет.',
          '2-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Когда мама выключала свет, комната {имя:род} становилась тёмной-претёмной. И было чуточку страшно.', 'a small child lying in bed in a dark cosy bedroom right after the light was switched off, wide open eyes, deep indigo shadows, soft moonlight from the window'),
    (2, 'В углу что-то темнело, и казалось, что там кто-то прячется. {имя} натянул одеяло до самого носа.', 'the same small child pulling a blanket up to the nose, glancing sideways at a dark corner where a vague soft shadow shape looms, cosy but tense mood'),
    (3, 'И вдруг у подушки зажёгся маленький тёплый огонёк. «Не бойся, {имя}, - сказал он. - Темнота совсем не злая».', 'a tiny glowing golden spark with a friendly little face hovering just above the pillow next to the surprised child, warm golden light spilling across the bedding'),
    (4, '«Хочешь, покажу?» - и огонёк тихонько поплыл к тёмному углу. {имя} следил за ним, не дыша.', 'the tiny golden spark floating slowly across the dark bedroom toward a corner, the child sitting up in bed watching it, trail of soft light behind the spark'),
    (5, 'В углу оказался не кто-то страшный, а любимая пушистая куртка на стуле. {имя} тихонько засмеялся.', 'the tiny golden spark lighting up a corner revealing a fluffy jacket hanging on a chair, the child sitting up in bed laughing with relief'),
    (6, 'Тогда {имя} сам протянул руку к темноте. И по всей комнате закружились тёплые огоньки, как звёздочки дома.', 'the child reaching out a hand while dozens of tiny warm golden lights swirl around the whole bedroom like indoor stars, magical and joyful'),
    (7, 'Стало тепло и спокойно. Огонёк устроился на подушке рядом и стал светить совсем тихо.', 'the child lying down peacefully with a serene smile, one tiny golden light resting on the pillow beside, calm deep indigo night room'),
    (8, 'Темнота - это просто время, когда отдыхают глазки. Спи спокойно, {имя}, твой огонёк не гаснет.', 'wide calm night sky above a sleeping house seen through a bedroom window, one single warm golden light glowing softly, deep indigo palette, peaceful closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('moon-invites', 'Луна ждёт в гости', 'Для тех, кто не хочет ложиться: засыпать - это маленькое путешествие', '«Ещё пять минуточек» знакомо каждому родителю. Эта сказка не уговаривает {имя:вин} спать, а переворачивает задачу: сон становится не концом дня, а началом дороги, где ждут.

К последней странице кровать превращается в самое интересное место в доме.',
          '2-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, '«Ещё капельку поиграю», - сказал {имя}. Спать совсем не хотелось, а день ещё столько всего не доделал.', 'a small child sitting on the bedroom floor among toys in warm evening light, refusing to go to bed, pyjamas already on, cosy room'),
    (2, 'Тут в окно тихонько постучали. Это была Луна, круглая и сонная. «{имя}, я жду тебя в гости».', 'a big round friendly moon with a gentle sleepy face peeking into a bedroom window at night, the surprised child looking up at it'),
    (3, '«А как я доберусь?» - удивился {имя}. «Очень просто, - зевнула Луна. - Дорога начинается у подушки».', 'the round moon face in the window smiling, the child standing by the bed pointing at the pillow, soft silver light across the floor'),
    (4, '{имя} лёг, закрыл глаза - и кровать мягко поплыла вверх, прямо сквозь потолок, к звёздам.', 'a child lying in a bed that gently floats upward through soft clouds into a starry night sky, blanket trailing, dreamy and safe'),
    (5, 'По дороге кровать здоровалась со звёздами. Каждая звезда говорила: «Добрый вечер, {имя}».', 'the floating bed with the child aboard passing among big friendly glowing stars with tiny faces, deep indigo sky, golden sparkles'),
    (6, 'Луна показала {имя:дат} спящий город: дома, дворы, качели. Все они тоже отдыхали.', 'view from above of a sleeping toy-like town at night with tiny warm windows, the child and the moon looking down together, cosy scale'),
    (7, '«Возвращайся утром», - шепнула Луна. Кровать тихонько опустилась обратно в комнату.', 'the bed with the sleeping child gently descending back into the bedroom through soft moonlight, the moon waving goodbye in the window'),
    (8, 'Спи, {имя}. Луна будет ждать тебя завтра, а дорога всегда начинается у подушки.', 'the child asleep peacefully in bed, the round moon glowing softly in the window, deep indigo and gold palette, calm closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('angry-cloud', 'Тучка, которая злилась', 'Про злость: её не надо прогонять, её можно обнять', 'Злость у малышей приходит быстрее, чем слова. Взрослые обычно просят «не злись» - и ребёнок остаётся один на один с чувством, которое всё равно никуда не делось.

Здесь {имя} встречает свою злость в виде маленькой грозовой тучки. Тучку не прогоняют. С ней сидят рядом, пока она сама не выдохнется. Ровно так это и работает на самом деле.',
          '3-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Башня упала в третий раз, и внутри у {имя:род} стало горячо-горячо. Так горячо, что захотелось топнуть.', 'a small child sitting on the floor beside a collapsed tower of blocks, face flushed with frustration, fists clenched, warm indoor light'),
    (2, 'И тогда над головой появилась маленькая тучка. Она хмурилась и глухо ворчала.', 'a small dark grey storm cloud with a grumpy face floating right above the head of the upset child, tiny lightning sparks, stylised and friendly not scary'),
    (3, '«Уходи!» - крикнул {имя}. Но тучка только потемнела и заворчала громче.', 'the child shouting up at the small storm cloud which grows darker and puffier above, the room slightly dimmer around them'),
    (4, '{имя} сел на пол и вздохнул. «Ладно. Посиди со мной, если хочешь».', 'the child sitting down cross-legged on the floor with a long breath, the small grumpy cloud hovering nearby, softer light returning'),
    (5, 'Они сидели рядом и дышали вместе. Тучка стала чуть светлее и перестала ворчать.', 'the child and the small cloud sitting side by side, the cloud noticeably lighter grey and calmer, gentle warm light in the room'),
    (6, 'А потом из тучки пошёл тёплый дождик. И она сделалась совсем маленькой, размером с ладошку.', 'warm golden rain drops falling from the now tiny pale cloud into the open palm of the child, magical and soothing'),
    (7, '«Ты не плохая, - сказал {имя}. - Ты просто злость. Ты приходишь и уходишь».', 'the child gently holding the tiny pale cloud in cupped hands close to the chest, calm and kind expression, warm light'),
    (8, 'Все чувства важные, {имя}. Даже самые горячие. Они всегда проходят.', 'a clear evening sky after rain with one tiny pale cloud drifting away and a soft rainbow, calm warm palette, peaceful closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('first-morning', 'Первое утро в садике', 'Про расставание с мамой и про то, что она возвращается всегда', 'Первое утро в садике - это не про садик. Это про вопрос «а мама вернётся?».

В этой сказке {имя} получает на ладошку невидимое мамино тепло, которое можно потрогать в любой момент дня. Приём взят из классики жанра и работает годами: у ребёнка появляется физическая точка опоры, пока мамы нет рядом.',
          '2-5 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Утром мама сказала: «Сегодня ты идёшь в садик». У {имя:род} внутри стало тихо и немножко пусто.', 'a small child in a hallway in the morning, holding the hand of a parent, backpack on, quiet uncertain expression, soft warm light'),
    (2, '«А ты вернёшься?» - спросил {имя}. «Всегда», - сказала мама и поцеловала ладошку.', 'a parent kneeling down and kissing the open palm of the small child, tender close moment in a bright hallway, warm golden light'),
    (3, '«Это тепло теперь твоё. Если станет грустно - прижми ладошку к щеке, и я окажусь рядом».', 'a soft glowing golden warm spot resting in the open palm of the child, the child looking at it with wonder, gentle magical glow'),
    (4, 'В садике было шумно и всё чужое. {имя} прижал ладошку к щеке - и стало теплее.', 'the small child standing at the edge of a busy colourful playroom with other children, pressing a palm to the cheek, soft golden glow on the cheek'),
    (5, 'Потом подошла девочка и протянула красный кубик. «Будешь строить со мной?»', 'another child holding out a red wooden block toward the main child in a bright playroom, first shy friendly contact, warm light'),
    (6, 'Они построили башню выше всех. {имя} и не заметил, как стало весело.', 'two children laughing beside a tall colourful block tower in a sunny playroom, joyful energetic moment'),
    (7, 'А вечером в дверях появилась мама. «Я же говорила», - улыбнулась она.', 'a parent appearing in a doorway with open arms, the child running toward them across the playroom, warm evening light, joyful reunion'),
    (8, 'Мама возвращается всегда, {имя}. А тепло на ладошке остаётся с тобой на весь день.', 'the parent carrying the happy child home at sunset, the child looking at their own palm with a smile, warm golden closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('now-we-are-two', 'Теперь нас двое', 'Про нового малыша в доме и про то, что любви не стало меньше', 'Когда появляется младший, старший впервые в жизни чувствует ревность - и пугается её сам. Чаще всего он не говорит «мне обидно», а начинает капризничать.

Эта сказка называет чувство вслух и показывает: любовь не делится на части, как пирог. У неё просто становится больше места.',
          '3-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Дома появился малыш. Совсем маленький, красный и очень громкий.', 'a newborn baby sleeping in a crib in a warm bedroom, a slightly older child peering over the edge of the crib with mixed curiosity'),
    (2, 'Все смотрели только на него. {имя} стоял в дверях и никто не заметил.', 'adults gathered around a crib cooing at a baby, the older child standing alone in the doorway behind them, warm light on the group, cooler light on the child'),
    (3, 'Внутри у {имя:род} стало колюче. Как будто любви теперь хватает не на всех.', 'the older child sitting alone on the stairs hugging their knees, thoughtful sad expression, soft warm evening light from a window'),
    (4, 'Мама села рядом. «Знаешь, любовь не пирог. Её не делят на кусочки».', 'a parent sitting beside the older child on the stairs, arm around them, gentle conversation, warm intimate light'),
    (5, '«Она как свет. Зажги вторую лампу - и светлее станет везде».', 'two warm glowing lamps lighting a cosy room together, the parent and child watching, golden light filling the whole space'),
    (6, 'Ночью малыш заплакал. {имя} подошёл первым и тихонько запел ту самую песенку.', 'the older child standing on tiptoes beside the crib at night singing softly to the crying baby, tender scene, soft night light'),
    (7, 'Малыш затих и схватил {имя:вин} за палец. Держал крепко-крепко.', 'a tiny baby hand gripping the finger of the older child, close tender detail, warm soft light, both calm'),
    (8, 'Теперь вас двое, {имя}. И света в доме стало ровно в два раза больше.', 'the older child and the baby together in soft warm light, the family around them, cosy closing image, golden palette')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('little-king-throne', 'Трон для маленького короля', 'Про горшок - без стыда, уговоров и «ну когда же уже»', 'Горшок - тема, где взрослые чаще всего давят, а ребёнок упирается. Работает противоположное: превратить обязанность в достижение, которое малыш выбирает сам.

Здесь горшок становится троном, а каждый поход - маленькой победой. Никаких «фу» и «стыдно»: только гордость и своё собственное решение.',
          '1-4 года', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'У {имя:род} появилась новая вещь. Круглая, важная и очень удобная.', 'a small colourful potty standing in the middle of a sunny nursery, a toddler looking at it curiously from a distance'),
    (2, '«Это трон, - сказала мама. - Он для тех, кто уже подрос».', 'a parent kneeling beside the small potty showing it to the curious toddler, warm bright room, friendly mood'),
    (3, '{имя} сначала не хотел. Трон был новый, а подгузник - привычный.', 'the toddler standing with arms crossed turning away from the potty, gentle stubborn expression, soft warm light'),
    (4, 'Мишка попробовал первым. Сел на трон и сказал: «Совсем не страшно».', 'a plush teddy bear sitting on the small potty, the toddler watching with growing interest, playful bright nursery'),
    (5, 'Тогда {имя} сел тоже. Оказалось, что трон как раз по размеру.', 'the toddler sitting confidently on the potty, feet on the floor, calm proud expression, bright cheerful room'),
    (6, 'И получилось! {имя} сам, без подгузника, совсем как большой.', 'the toddler standing beside the potty with arms raised in triumph, big proud smile, sunny room, confetti of golden sparkles'),
    (7, 'Мама захлопала в ладоши. А на стене появилась первая наклейка-звезда.', 'a parent clapping while the toddler places a golden star sticker onto a chart on the wall, joyful warm scene'),
    (8, 'Ты уже большой, {имя}. И у тебя есть свой собственный трон.', 'the toddler sitting on the potty like on a throne wearing a paper crown, teddy bear beside, humorous warm closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('doctor-warm-light', 'Доктор и тёплый фонарик', 'Про страх врача: непонятное становится нестрашным', 'Дети боятся не врача, а неизвестности: что сейчас будет и будет ли больно.

В этой сказке {имя} заранее знакомится с каждым инструментом - трубочкой, фонариком, молоточком - и даже пробует их сам. Приём проверенный: то, что ты подержал в руках, перестаёт быть страшным.',
          '2-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Мама сказала: «Сегодня к доктору». {имя} остановился в коридоре и не пошёл.', 'a small child standing frozen in a hallway holding the hand of a parent, worried expression, soft indoor light'),
    (2, '«А будет больно?» - «Сегодня доктор просто послушает, как ты дышишь».', 'a parent crouching to eye level explaining gently to the worried child, calm reassuring moment, warm light'),
    (3, 'В кабинете доктор улыбнулся и показал трубочку. «Хочешь послушать сам?»', 'a friendly doctor in a bright cheerful clinic room offering a stethoscope to the curious child, warm welcoming atmosphere'),
    (4, '{имя} послушал мишку. Сердце у мишки стучало: тук-тук, тук-тук.', 'the child using a stethoscope on a plush teddy bear while the doctor watches with a smile, bright friendly clinic room'),
    (5, 'Потом доктор посветил тёплым фонариком в горло. «Скажи а-а-а». Совсем не больно.', 'the doctor gently shining a small warm light while the child opens the mouth saying aaah, calm cooperative moment, bright room'),
    (6, 'И постучал по коленке маленьким молоточком. Нога подпрыгнула сама, и {имя} засмеялся.', 'a small reflex hammer tapping the knee of the child whose leg kicks up by itself, the child laughing with surprise, cheerful clinic'),
    (7, '«Ты здоров», - сказал доктор и дал наклейку. Самую блестящую.', 'the doctor handing a shiny golden star sticker to the happy child, warm bright clinic room, proud moment'),
    (8, 'Доктор помогает, {имя}. А непонятное перестаёт быть страшным, когда его потрогаешь.', 'the child walking out of the clinic holding the hand of the parent, sticker on the shirt, sunny street, warm closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('one-ball-for-two', 'Один мячик на двоих', 'Про «моё!» и про то, что вдвоём интереснее', '«Моё» - нормальная стадия развития, а не жадность. Ребёнок в этом возрасте только учится границам своего и чужого, и требовать «поделись» бесполезно.

Сказка не стыдит {имя:вин}, а показывает изнутри: одному с мячиком быстро становится скучно, а вдвоём начинается игра.',
          '3-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'У {имя:род} был красный мячик. Самый лучший на всей площадке.', 'a small child on a sunny playground hugging a bright red ball tightly, proud happy expression, green summer park'),
    (2, 'Подошёл мальчик и попросил: «Дай поиграть». «Моё!» - {имя} прижал мячик крепче.', 'another child asking with an open hand while the main child clutches the red ball closer, sunny playground, tense little moment'),
    (3, 'Мальчик ушёл. {имя} остался с мячиком совсем один.', 'the child alone on a wide sunny playground holding the red ball, other children playing far in the background, slightly lonely mood'),
    (4, 'Он покатал мячик туда. Покатал обратно. Стало почему-то скучно.', 'the child sitting on the ground listlessly rolling the red ball back and forth alone, sunny but empty playground around'),
    (5, 'Тогда {имя} сам подошёл к мальчику. И тихонько катнул мячик ему.', 'the child rolling the red ball across the ground toward the other child, first friendly move, sunny playground, hopeful mood'),
    (6, 'Мячик покатился обратно. Потом снова туда. И это оказалось гораздо веселее.', 'two children joyfully rolling a red ball back and forth between them on a sunny playground, laughter and movement'),
    (7, 'Скоро играли уже пятеро. Мячик был один, а смеха - целая площадка.', 'five children playing together with one red ball on a bright playground, lots of laughter and motion, sunny cheerful scene'),
    (8, 'Вещь остаётся вещью, {имя}. А игра начинается, когда вас двое.', 'two children sitting side by side on a bench with the red ball between them at golden hour, warm friendly closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('who-hears-silence', 'Кто слушает тишину', 'Про грусть, которую не надо чинить - её надо услышать', 'Когда ребёнку грустно, взрослые бросаются исправлять: «не плачь», «давай купим», «зато смотри». А нужно совсем другое - чтобы кто-то просто сел рядом и остался.

Эта сказка построена на приёме из «The Rabbit Listened»: все звери предлагают {имя:дат} решения, и только один молча садится рядом. Именно это и помогает.',
          '3-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, 'Домик из кубиков, который {имя} строил всё утро, рассыпался. И стало очень грустно.', 'a small child sitting on the floor beside a collapsed block house, shoulders down, quiet sad expression, soft indoor light'),
    (2, 'Прибежал петушок: «Не грусти! Давай кричать громко-громко!» {имя} не захотел.', 'a lively cartoon rooster flapping and crowing beside the sad seated child who turns away quietly, warm room'),
    (3, 'Пришёл слонёнок: «Давай всё сломаем!» {имя} покачал головой.', 'a small cartoon elephant raising a foot playfully over the blocks while the sad child shakes their head, cosy room'),
    (4, 'Прискакал зайчик: «Забудь, побежали играть!» Но забывать не хотелось.', 'a cartoon rabbit tugging gently at the sleeve of the sad child who stays seated, warm indoor light'),
    (5, 'А потом тихо подошёл медвежонок. Он ничего не сказал. Просто сел рядом.', 'a soft plush-like bear cub quietly sitting down next to the sad child on the floor, no words, gentle warm light, tender pause'),
    (6, 'Они сидели молча. И {имя} вдруг заплакал, а медвежонок остался рядом.', 'the child crying softly while the bear cub sits close beside without moving away, warm compassionate scene, soft light'),
    (7, 'Когда слёзы кончились, {имя} сказал: «Давай построим снова». И они построили.', 'the child and the bear cub building a new block house together, first small smile returning, warm afternoon light'),
    (8, 'Грусть проходит, {имя}, когда рядом кто-то есть. Даже если он молчит.', 'the child and the bear cub sitting side by side in front of a finished block house at golden hour, calm warm closing image')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;

WITH new_product AS (
  INSERT INTO products (slug, title, tagline, about, audience, kind, price_tokens, status)
  VALUES ('star-defender', 'Звёздный защитник', 'Про смелость: она не в том, чтобы быть большим', 'Малыши часто чувствуют себя самыми маленькими и слабыми. Смелость они представляют как силу и рост.

Эта сказка меняет определение: смелый - тот, кто заступается за того, кто ещё меньше. {имя} спасает крошечную звёздочку и обнаруживает, что храбрость измеряется не ростом, а поступком.',
          '3-6 лет', 'book', 25, 'draft')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO product_pages (product_id, position, text, prompt)
SELECT new_product.id, v.position, v.text, v.prompt
FROM new_product, (VALUES
    (1, '{имя} был самым маленьким во дворе. И казалось, что смелость - это когда ты большой.', 'a small child standing among taller children on a playground at dusk, looking slightly up at them, thoughtful expression'),
    (2, 'Однажды вечером с неба упала звёздочка. Совсем крошечная и очень тусклая.', 'a tiny dim golden star lying in the grass at night, the small child crouching down to look at it with wonder, deep indigo evening'),
    (3, '«Мне холодно», - прошептала звёздочка. И почти погасла.', 'the tiny star fading in the cupped hands of the child, faint golden light, night garden, tender worried moment'),
    (4, '{имя} спрятал её в ладошки и подышал. Звёздочка засветилась чуть ярче.', 'the child breathing gently onto the tiny star held in cupped hands, the star glowing brighter, warm golden light on the face'),
    (5, 'Но налетел холодный ветер и хотел задуть огонёк совсем.', 'a gust of cold blue wind swirling around the child who shields the tiny star with both hands and body, dramatic but not scary'),
    (6, 'Тогда {имя} закрыл звёздочку собой. «Не трогай её. Она маленькая».', 'the small child standing firm with back to the wind, curled protectively over the glowing star in the hands, brave posture, night scene'),
    (7, 'Ветер утих. Звёздочка поднялась в небо и засияла так ярко, как никогда.', 'the tiny star rising up into the night sky shining brilliantly, the child looking up with a happy face, golden light everywhere'),
    (8, 'Смелость - это защищать тех, кто меньше, {имя}. И расти для этого не обязательно.', 'the child standing under a wide starry sky with one especially bright star above, calm proud closing image, deep indigo and gold')
) AS v(position, text, prompt)
ON CONFLICT (product_id, position) DO NOTHING;
