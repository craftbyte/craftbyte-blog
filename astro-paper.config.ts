import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://craftbyte.blog/",
    title: "CraftByte's Ramblings",
    description: "A personal blog about software development, technology, and life.",
    author: "CraftByte (Anja)",
    profile: "https://anze.dev",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Europe/Ljubljana",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: false,
    showBackButton: true,
    editPost: {
      enabled: false,
      // url: "https://github.com/craftbyte/craftbyte-blog/edit/main/",
    },
    search: false,
  },
  socials: [
    { name: "github",   url: "https://github.com/craftbyte" },
    { name: "mastodon", url: "https://social.treehouse.systems/@anze" },
    { name: "linkedin", url: "https://www.linkedin.com/in/anzejensterle/" },
    { name: "mail",     url: "mailto:hello@anze.dev" },
  ],
  shareLinks: [
    { name: "mastodon", url: "https://mastodonshare.com/?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});