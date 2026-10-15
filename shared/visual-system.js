export const graphicStyleVersion = 'V2';
export const legacyGraphicStyleVersion = 'V1';

export const refs = [
  ['Furry Mole', 'v2/V2_Reference_01_furry_mole.png', 'soft fur / close bust / minimal face', 'pink'],
  ['Cat with Yarn', 'v2/V2_Reference_02_cat_yarn.png', 'animal avatar / knit motif / compact crop', 'pink-blue'],
  ['Alien Bust', 'v2/V2_Reference_03_alien_bust.png', 'creature bust / smooth skin / graphic eyes', 'green'],
  ['Hamster with Seed', 'v2/V2_Reference_04_hamster_seed.png', 'animal bust / small held motif / plush texture', 'warm tan'],
  ['Dog with Sunglasses', 'v2/V2_Reference_05_dog_sunglasses.png', 'animal portrait / sunglasses / confident styling', 'gray-orange'],
  ['Blonde Avatar', 'v2/V2_Reference_06_blonde_avatar.png', 'human bust / sculpted hair / simple features', 'blonde'],
  ['Cap Avatar', 'v2/V2_Reference_07_cap_avatar.png', 'human bust / denim cap / casual styling', 'blue'],
  ['Sunglasses Avatar', 'v2/V2_Reference_08_sunglasses_avatar.png', 'human bust / black top / fashion accent', 'black-brown'],
  ['Denim Avatar', 'v2/V2_Reference_09_denim_avatar.png', 'human bust / sunglasses / denim jacket', 'denim'],
  ['Beanie Glasses Avatar', 'v2/V2_Reference_10_beanie_glasses_avatar.png', 'human bust / knit beanie / glasses', 'brown-blue'],
  ['Headphones Avatar', 'v2/V2_Reference_11_headphones_avatar.png', 'human bust / headphones / hair silhouette', 'gray-black'],
  ['Bob Avatar', 'v2/V2_Reference_12_bob_avatar.png', 'human bust / bob hair / knit garment', 'tan-brown'],
];

export const legacyRefs = [
  ['Cinema Hunter','v1/AI_Profile_Image_CinemaHunter.png','oversized glasses / drink cup','coral'], ['Gaming News Insider','v1/AI_Profile_Image_GamingNewsInsider.png','headset / analyst','blue'], ['Actors Now','v1/AI_Profile_Image_ActorsNow.png','clapperboard head / mascot','pink'], ['Golf Trend Desk','v1/AI_Profile_Image_GolfTrendDesk.png','golf-ball head / cap','lavender'], ['Hit Chart Radio','v1/AI_Profile_Image_HitChartRadio.png','headphones / closed-eye expression','sky'], ['Idol Fan Journal','v1/AI_Profile_Image_IdolFanJournal.png','cat ears / fan','lime'], ['K-POP Frontline!','v1/AI_Profile_Image_K-POPFrontline!.png','cap / glasses','blue'], ['Maleidol','v1/AI_Profile_Image_Maleidol.png','heart eyes / idol','violet'], ['Must Read Manga Selector','v1/AI_Profile_Image_MustReadMangaSelector.png','green eyepiece / chunky hair','green'], ['SNS Buzz Roundup','v1/AI_Profile_Image_SNSBuzzRoundup.png','phone / social','mint'], ['Viral Convenience Store Food','v1/AI_Profile_Image_ViralConvenienceStoreFood.png','rice-ball costume / simple face','blush'], ['Animation','v1/AI_Profile_Image_Animation.png','hood / observer','cream'], ['Baseball','v1/AI_Profile_Image_Baseball.png','baseball head / headset','ice'], ['Comedy','v1/AI_Profile_Image_Comedy.png','duo / stage','yellow'], ['Drama','v1/AI_Profile_Image_Drama.png','star-shaped eye highlights / yellow hoodie','peach'], ['Soccer','v1/AI_Profile_Image_Soccer.png','soccer ball / headband mascot','blue'], ['Variety','v1/AI_Profile_Image_Variety.png','swept hair / large highlighted eyes','pink']
];

export const styleDNA = {
  version: 'V2 Current / Default Graphic Style. Preserve V1 as the legacy toy-like mascot system, but generate new images in this mature contemporary editorial 3D avatar language.',
  illustration: 'Contemporary stylized 3D editorial avatar system for AI Matome profile images. The image may be a human bust, animal, creature, or object-inspired character, selected by the Agent concept. Keep the look simplified, graphic, and friendly without defaulting to a childish cute mascot or toy figurine.',
  proportions: 'Use mature avatar proportions: close head-and-shoulders or upper-bust framing with a substantial head, visible neck or shoulder structure when relevant, and a body that feels cropped rather than tiny. Human agents should not be chibi-like; animal, creature, and object-inspired agents may be more iconic but must avoid baby-like oversized-head-with-tiny-body proportions.',
  face: 'Simplified face language: dot or oval eyes, short brows, a small line or filled shape for the mouth, and only a minimal nose mark when helpful. Expressions should be calm, witty, confident, curious, or lightly warm rather than automatically kawaii. Avoid exaggerated sparkling eyes, heavy blush, sculpted lips, realistic eyes, and preschool-style cheerfulness.',
  headToBody: 'Human avatars use a mature bust portrait ratio, roughly head plus neck and cropped shoulders; the head can be graphically emphasized but should not dwarf the body. Non-human characters may use fuller head shapes or object bodies, but the silhouette should feel editorial and intentional rather than generic mascot merchandise.',
  characterType: 'Choose the best structure for the Agent concept: human, animal, creature, or object-inspired character. Do not force every Agent into the same species or body plan. Consistency comes from the shared V2 rendering, crop, simplified features, material restraint, and styling discipline.',
  hair: 'Hair is sculpted into clear contemporary masses: soft waves, bob shapes, bangs, tied hair, cropped hair, or simple locks. Use broad forms with clean edges and subtle volume; no individual strands, flyaways, glamorous anime hair, or hyperreal grooming.',
  styling: 'Use silhouette, contemporary styling, and one distinctive feature to communicate identity. Glasses, sunglasses, a cap, beanie, headphones, collar, jacket, knitwear, or one compact object can define the Agent. Prefer one clear styling cue over costume-like storytelling, piles of props, or literal keyword decoration.',
  material: 'Allow limited material diversity: smooth skin, sculpted hair, matte fabric, denim-like cloth, knit ribbing, soft fur, plush surfaces, rubbery creature skin, and small glossy accents such as lenses. Keep textures medium-scale and readable, not photorealistic microdetail. Do not apply identical smooth clay or glossy plastic to every character.',
  geometry: 'Use clean 3D forms with softened edges, simplified planes, and balanced volume. Shapes may be rounded but not uniformly blobby. Let animal snouts, ears, hair, hats, glasses, and shoulders create distinctive silhouettes while keeping the profile icon legible.',
  metaphor: 'The Agent Variable Layer supplies the subject, personality, and concept. Translate that meaning into one primary visual metaphor or one distinctive styling feature inside the V2 avatar system. The fixed layer controls visual consistency only; it must not collapse every Agent into the same cute mascot formula.',
  props: 'Keep props restrained. Use no prop by default, or one integrated motif when it is essential to the Agent category. Held objects should be close to the face or bust and secondary to the character. Avoid prop inventories, floating icons, badges, scenery, and costume-like visual storytelling.',
  composition: 'Create one square 1:1 avatar with a single dominant character in a close portrait crop. Use front or slight three-quarter view. Keep eyes, mouth, headwear, glasses, and the defining feature safely inside the circular profile crop. The character should fill the frame enough for small-avatar readability without becoming a cramped toy close-up.',
  background: 'Use a clean, full-frame pastel or soft solid background, often pink or another light hue coordinated with the subject. Backgrounds stay plain and editorial: no scenery, horizon, floor, spotlight disk, pattern, particles, UI elements, or collage frame.',
  lighting: 'Soft studio lighting with gentle shadows, broad highlights, and clear form separation. Rendering should feel polished and modern but restrained, with no cinematic drama, harsh rim light, neon glow, lens effects, or photoreal skin translucency.',
  color: 'Use contemporary, balanced color blocking: natural skin or fur tones where appropriate, neutral hair or clothing masses, and one or two controlled accent colors. Avoid making every character pastel-cute; allow black, denim, gray, brown, tan, green, and other grounded tones while keeping the avatar bright and readable.',
  rendering: 'Polished stylized 3D render with smooth volume, moderate material cues, and clean silhouettes. It should read as a modern digital editorial avatar/profile character system, not a children’s toy collectible, generic cute mascot, Pixar-like character, or photorealistic portrait.',
  detail: 'Medium-low detail level. Include enough hair, fabric, fur, eyewear, or accessory structure to feel contemporary and specific, but keep details broad and crop-safe. Avoid pores, eyelashes, tiny seams, tiny fasteners, ornate clothing, realistic wrinkles, and dense texture noise.',
  avoid: 'Overly childish style; baby-like proportions; chibi character; preschool animation style; generic cute mascot; excessively oversized head with tiny body; uniformly rounded everything; kawaii expression as the default; exaggerated sparkling eyes; excessive blush; indiscriminate toy figurine appearance; overly glossy plastic; generic Pixar-like character rendering; excessive props; costume-like visual storytelling; photorealistic human rendering; realistic anatomy; detailed skin pores, wrinkles, eyelashes, teeth, makeup, sculpted lips, individual hair strands, realistic fabric micro-weave, logos, readable text, watermarks, frames, collages, scenery, dramatic lighting, and copying any V2 reference character exactly.'
};

export const conceptVariations = {
  subject: 'Human, animal, creature, and object-inspired characters are all valid. Choose by Agent meaning: a media analyst may be a styled human bust, a playful pet topic may become an animal portrait, a speculative or unusual topic may become a creature, and a category built around an iconic object may use an object-inspired character.',
  expression: 'Use minimal facial marks across all character types, but tune the expression toward the Agent: composed confidence, curious attention, subtle smile, relaxed focus, or dry humor. Cuteness can appear when conceptually right, but it is not the default emotional setting.',
  hairAndCostume: 'Human avatars can use contemporary hair, caps, beanies, glasses, sunglasses, headphones, collars, jackets, knits, or simple tops. Non-human agents can use ears, snouts, fur, creature skin, or one wearable styling cue. Avoid stacking multiple style references onto one character.',
  materialTreatment: 'V2 supports controlled material contrast: skin versus hair, fur versus knit, matte fabric versus glossy lenses. Pick only the materials needed by the concept and keep them simplified.',
  symbol: 'A single distinctive feature should carry identity: eyewear, headwear, headphones, a compact held object, a unique hair silhouette, an animal snout or ear shape, or an object-derived head/body. Do not translate every keyword into a separate prop.',
  framing: 'Most V2 references are close bust portraits that remain crop-safe inside a circular avatar. Non-human references can fill more of the frame, while human references show enough shoulders and styling to feel mature.',
  backgroundConsistency: 'The references use clean pastel circular-avatar-friendly backgrounds. Keep the background simple and supportive; the family resemblance should come from the avatar crop and rendering, not from repeating the same character type.',
  legacyNote: 'V1 remains the legacy playful toy mascot style. V2 keeps simplification and avatar readability, but reduces the chibi mascot bias and allows more mature proportions, styling, and material variation.',
};

export function analyzeAgent(agent) {
  const text = Object.values(agent).join(" ").toLowerCase();
  const isComedy = /お笑い|코미디|comedy|funny|humor/.test(text);
  const isNews = /news|뉴스|最新|trend|트렌드|情報/.test(text);
  const isMusic = /music|song|chart|idol|k-pop|kpop|음악|아이돌|노래|チャート|音楽/.test(text);
  const motif = isComedy
    ? 'subtle performance cue such as a compact microphone, expressive brows, or confident presenter styling'
    : isNews
      ? 'contemporary curator cue such as glasses, cap, headset, or one compact bulletin object'
      : isMusic
        ? 'audio or fan-culture cue such as headphones, glasses, or one clean accent accessory'
        : 'one distinctive silhouette, styling cue, or category-defining object that instantly signals the Agent category';
  return {
    coreRole: agent.purpose || agent.role || (isNews ? 'A selective curator who makes fast-moving updates feel clear and approachable' : 'A focused guide who turns a niche into a recognizable daily briefing'),
    personality: agent.tone || 'Warm, contemporary, curious, and lightly expressive without becoming childish',
    visualMotif: [agent.visualNotes || agent.concept, motif].filter(Boolean).join(': ') || motif,
    primaryObject: agent.visualNotes || (isComedy ? 'compact microphone or confident presenter accessory' : isNews ? 'one compact bulletin object or editorial eyewear/headwear cue' : 'category-defining styling cue or hero motif'),
    secondaryObjects: 'none by default; at most one small supporting prop if essential to the category',
    mood: isComedy ? 'witty, confident, energetic, modern' : 'approachable, focused, contemporary, optimistic',
    composition: `${agent.characterType ? `${agent.characterType} character direction; ` : ''}${agent.gender ? `${agent.gender} gender impression; ` : ''}${agent.age ? `${agent.age} age impression; ` : ''}Mature close bust portrait or iconic non-human avatar in the V2 editorial 3D style; visible neck/shoulders when relevant, one distinctive feature, minimal facial marks, and a circular-crop-safe silhouette`,
    color: agent.colors || (isComedy ? 'warm grounded neutrals with one bright accent' : 'balanced contemporary palette with natural tones plus one controlled signature accent'),
    balance: isComedy ? 'Character-led, with one compact cue supporting the expression' : 'Balanced avatar identity and one symbolic feature'
  };
}
