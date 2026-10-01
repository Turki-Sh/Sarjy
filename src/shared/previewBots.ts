// The bots that fetch a link to draw its preview card in a chat or a post. They skip any page that
// answers 404, so a missing page would show no card at all; app/[...missing] answers them 200.
// Search engines are not on this list: they still get the real 404.
const PREVIEW_BOTS =
  /facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|linkedinbot|skypeuripreview|pinterest|redditbot|embedly|iframely|vkshare|mastodon|bluesky|cardyb|snapchat|viber|line-poker|kakaotalk/i;

export const isPreviewBot = (userAgent: string | null) => !!userAgent && PREVIEW_BOTS.test(userAgent);
