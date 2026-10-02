export const refs = [
  ['Cinema Hunter','AI_Profile_Image_CinemaHunter.png','oversized glasses / drink cup','coral'], ['Gaming News Insider','AI_Profile_Image_GamingNewsInsider.png','headset / analyst','blue'], ['Actors Now','AI_Profile_Image_ActorsNow.png','clapperboard head / mascot','pink'], ['Golf Trend Desk','AI_Profile_Image_GolfTrendDesk.png','golf-ball head / cap','lavender'], ['Hit Chart Radio','AI_Profile_Image_HitChartRadio.png','headphones / closed-eye expression','sky'], ['Idol Fan Journal','AI_Profile_Image_IdolFanJournal.png','cat ears / fan','lime'], ['K-POP Frontline!','AI_Profile_Image_K-POPFrontline!.png','cap / glasses','blue'], ['Maleidol','AI_Profile_Image_Maleidol.png','heart eyes / idol','violet'], ['Must Read Manga Selector','AI_Profile_Image_MustReadMangaSelector.png','green eyepiece / chunky hair','green'], ['SNS Buzz Roundup','AI_Profile_Image_SNSBuzzRoundup.png','phone / social','mint'], ['Viral Convenience Store Food','AI_Profile_Image_ViralConvenienceStoreFood.png','rice-ball costume / simple face','blush'], ['Animation','AI_Profile_Image_Animation.png','hood / observer','cream'], ['Baseball','AI_Profile_Image_Baseball.png','baseball head / headset','ice'], ['Comedy','AI_Profile_Image_Comedy.png','duo / stage','yellow'], ['Drama','AI_Profile_Image_Drama.png','star-shaped eye highlights / yellow hoodie','peach'], ['Soccer','AI_Profile_Image_Soccer.png','soccer ball / headband mascot','blue'], ['Variety','AI_Profile_Image_Variety.png','swept hair / large highlighted eyes','pink']
];

export const styleDNA = {
  illustration: 'Simple stylized 3D mascot/avatar built from a few toy-like geometric masses. Quirky, playful and iconic, with deliberately abbreviated anatomy and graphic expressions. Match the supplied avatar system rather than a generic cute-3D genre.',
  proportions: 'An oversized head or category-defining object dominates the avatar; the visible body is very small and simple, often only a cropped upper torso. Limbs and hands, when present, are short, simplified supporting shapes rather than anatomically modeled features.',
  face: 'Extremely simplified facial features: small solid dots or ovals, short lines or arcs for eyes and brows, and a minimal curved line or simple open shape for the mouth where appropriate. Use only the few marks needed for the expression; omit anatomical eye, nose, lip and cheek detail. Symbolic eyes are an optional concept variation, not a requirement for every face.',
  hair: 'Smooth solid hair shapes: a few rounded locks, a single swept mass, chunky bangs or a simplified braid. Treat each section as one solid geometric form; no individual hair strands, wisps, flyaways or strand-by-strand shading.',
  geometry: 'Simplified toy-like geometry with clean, easily separated rounded volumes and broad color regions. Clothing is a basic hood, cap, shirt or jacket shape; suggest construction only where needed to identify it. No realistic skin, hair or fabric detail.',
  metaphor: 'One strong visual metaphor or category-defining object must carry the identity. The character and object may merge humorously, such as a sports-ball head or a face inside a clapperboard or food shape. These are alternative concepts, not extra objects to combine in every image.',
  props: 'Minimal props: prioritize the single defining symbol, integrated into the head, costume or silhouette when useful. Add at most one small supporting prop only if it contributes necessary meaning. Do not turn keywords into a collection of decorative accessories.',
  composition: 'Compact square profile framing with a dominant head/object and cropped small body, seen front-on or in a slight three-quarter view. Keep facial marks and the defining symbol legible within a small circular crop. Recognition must survive very small profile-image display without relying on fine detail or text.',
  background: 'Simple pastel gradient background with a soft blend between light hues. No depicted location, set, horizon, background objects or decorative particles.',
  lighting: 'Soft studio lighting with broad gentle highlights and soft shading that clarify the simple volumes. Keep the face and symbol readable, without dramatic cinematic contrast or realistic skin rendering.',
  color: 'Broad, distinct solid color areas on the subject against a light pastel gradient. Agent-specific hair, clothing and symbol colors establish identity; use colors to separate forms, not detailed surface shading or ornament.',
  avoid: 'Anime-style character beauty; Pixar-like character rendering; realistic human 3D render; realistic or proportionate human anatomy; detailed skin, pores, wrinkles, skin translucency, makeup or sculpted lips; detailed hair, individual strands and flyaways; detailed irises, intricate eye reflections and universal oversized sparkling eyes; realistic fabric weave, folds, seams or stitches; material microtexture, clay fingerprints or sculpting marks; excessive decorative props, floating icons, confetti and particles; cinematic scenery or dramatic lighting; full-body detail, tiny subjects, hard illustrated outlines, readable typography, logos and watermarks. Do not copy reference-specific text or surface texture into the common style.'
};

// Observed exceptions belong to concept selection, never to mandatory rendering rules.
export const conceptVariations = {
  subject: 'Human-like avatars, object-headed mascots and object-costume hybrids coexist. Actors Now integrates a clapperboard, Golf Trend Desk and Baseball use ball-shaped heads, and Viral Convenience Store Food places a simple face within a rice-ball costume.',
  expression: 'Actors Now and Golf Trend Desk use dot/line-like faces; Hit Chart Radio uses closed-eye arcs; Maleidol uses heart-shaped eyes. Variety has larger highlighted eyes, while Comedy uses exaggerated brows and mouths. The shared rule is graphic simplification, not identical eyes or a universal beauty treatment.',
  hairAndCostume: 'Cinema Hunter and Variety use large swept hair masses; Gaming News Insider uses chunky hair under a knit cap; Maleidol has a simple braid; Animation and Drama use hoods. Select a few defining shapes rather than combining these accessories.',
  symbol: 'Headphones recur in music and gaming; a phone identifies SNS Buzz Roundup; sports balls and the clapperboard can become part of the character itself. Choose one subject-specific metaphor and avoid copying an existing identity.',
  framing: 'Most references show a single large head with a small cropped torso. Comedy is a two-character exception. Hand gestures, head angle and the placement of one symbol vary; a pair or dramatic pose is not a global requirement.',
  textureExceptions: 'Visible knit ribbing, rice-like bumps, golf-ball dimples and short-fur appearance occur in individual references. These are not shared Style DNA. For new generation, simplify material identity through shape and color; do not request realistic hair, fabric or microtexture.',
  letteringException: 'K-POP Frontline! includes cap lettering. This is not a common requirement. New images should convey identity without readable text, especially at avatar size.',
};

export function analyzeAgent(agent) {
  const text = Object.values(agent).join(" ").toLowerCase();
  const isComedy = /お笑い|코미디|comedy|funny|humor/.test(text);
  const isNews = /news|뉴스|最新|trend|트렌드|情報/.test(text);
  const motif = isComedy ? 'spotlight microphone and playful stage gesture' : isNews ? 'compact bulletin stack with a curious lookout gesture' : 'signature object that instantly signals the Agent category';
  return {
    coreRole: agent.role || (isNews ? 'A fast, selective curator of what matters now' : 'A passionate guide who turns a niche into a clear daily briefing'),
    personality: agent.tone || 'Warm, expressive, curious, and slightly obsessive in a charming way',
    visualMotif: agent.concept ? `${agent.concept}: ${motif}` : motif,
    primaryObject: isComedy ? 'retro microphone' : isNews ? 'floating news cards' : 'category-defining hero prop',
    secondaryObjects: isComedy ? 'optional single small award ribbon, only if needed; no other supporting props' : 'none by default; at most one small supporting prop if essential to the category',
    mood: isComedy ? 'bright, witty, energetic' : 'approachable, focused, optimistic',
    composition: 'Oversized mascot head or object-face above a very small cropped torso, with the defining symbol integrated into or held close to the head; simple facial marks and one compact readable gesture',
    color: isComedy ? 'warm coral, butter yellow, cherry red accent' : 'pastel base with one saturated signature accent',
    balance: isComedy ? 'Character-led, with prop supporting the expression' : 'Balanced character and symbolic object'
  };
}
