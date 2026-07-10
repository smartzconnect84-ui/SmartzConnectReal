// ── Product Tour step registry ──────────────────────────────────────────────
// Central, declarative list of every tour step. Adding a new feature to the
// tour is just adding one more object here + a matching `data-tour="<id>"`
// attribute somewhere in the relevant page/nav component.
//
// `target` is a CSS selector matched against `data-tour="<value>"`. If the
// element can't be found (off-screen nav item hidden on this breakpoint, not
// yet mounted, etc.) the tour falls back to a centered, spotlight-less card
// so the walkthrough never gets stuck.

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  title: string
  description: string
  /** In-app route to navigate to before looking for the target element. */
  route?: string
  /** data-tour value of the element to spotlight. Omit for an info-only step. */
  target?: string
  placement?: TourPlacement
  /** Roles allowed to see this step. Omitted = every signed-in role. */
  roles?: string[]
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home-feed',
    title: 'Home Feed',
    description: 'Your personalized feed of posts, photos and updates from people you follow — this is home base.',
    route: '/app/feed',
    target: 'nav-feed',
    placement: 'right',
  },
  {
    id: 'search',
    title: 'Search',
    description: 'Find people, posts and communities instantly. Start typing to search across all of SmartzConnect.',
    route: '/app/feed',
    target: 'nav-search',
    placement: 'bottom',
  },
  {
    id: 'discover',
    title: 'Spotlight / Discover',
    description: 'Swipe through spotlighted profiles to discover new people near you and around the world.',
    route: '/app/discover',
    target: 'nav-discover',
    placement: 'right',
  },
  {
    id: 'stories',
    title: 'Stories',
    description: 'Share short-lived photo or text updates that disappear after 24 hours. Tap the + to add your own.',
    route: '/app/feed',
    target: 'feed-stories',
    placement: 'bottom',
  },
  {
    id: 'posts',
    title: 'Posts',
    description: 'Share photos, videos or thoughts with your network from the composer at the top of your feed.',
    route: '/app/feed',
    target: 'feed-composer',
    placement: 'bottom',
  },
  {
    id: 'comments-reactions',
    title: 'Comments & Reactions',
    description: 'React with an emoji or leave a comment on any post — tap the reaction bar under a post to try it.',
    route: '/app/feed',
    target: 'feed-post-actions',
    placement: 'top',
  },
  {
    id: 'messaging',
    title: 'Messaging',
    description: 'Chat privately with your matches and friends in real time, including photos, voice notes and more.',
    route: '/app/matches',
    target: 'nav-messages',
    placement: 'right',
  },
  {
    id: 'voice-calls',
    title: 'Voice Calls',
    description: 'Start a crystal-clear voice call with anyone in your contacts, right from the app.',
    route: '/app/feed',
    target: 'nav-audio-call',
    placement: 'bottom',
  },
  {
    id: 'video-calls',
    title: 'Video Calls',
    description: 'Face-to-face video calling powered by LiveKit — perfect for getting to know a match.',
    route: '/app/feed',
    target: 'nav-video-call',
    placement: 'bottom',
  },
  {
    id: 'groups',
    title: 'Groups / Communities',
    description: 'Join or create group chats around shared interests, hobbies or communities.',
    route: '/app/groups',
    target: 'nav-groups',
    placement: 'right',
  },
  {
    id: 'friends',
    title: 'Friends / Connections',
    description: 'Manage your friend requests, followers and connections all in one place.',
    route: '/app/friends',
    target: 'nav-friends',
    placement: 'right',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'This is how others see you. Keep your photos, bio and interests up to date to get better matches.',
    route: '/app/profile',
    target: 'nav-profile',
    placement: 'right',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay on top of likes, comments, new matches and messages — all your alerts land here.',
    route: '/app/notifications',
    target: 'nav-notifications',
    placement: 'right',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Customize notifications, appearance, and your account from one central settings page.',
    route: '/app/settings',
    target: 'nav-settings',
    placement: 'right',
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    description: 'Control who can see your profile and message you, and manage your data — all inside Settings.',
    route: '/app/settings',
    target: 'settings-privacy-section',
    placement: 'top',
  },
  {
    id: 'smartzmarket',
    title: 'SmartzMarket',
    description: 'Buy and sell items with other members in our built-in marketplace.',
    route: '/app/marketplace',
    target: 'nav-marketplace',
    placement: 'right',
  },
  {
    id: 'smartzads',
    title: 'SmartzAds',
    description: 'Promote your business or profile to thousands of members with targeted in-app advertising.',
  },
  {
    id: 'smartztv',
    title: 'SmartzTV Live',
    description: 'Watch live streams or go live yourself and connect with your audience in real time.',
    route: '/app/smartztv',
    target: 'nav-smartztv',
    placement: 'right',
  },
  {
    id: 'smartzride',
    title: 'SmartzRide',
    description: 'Book a ride or become a driver — SmartzRide connects riders and drivers right from the app.',
    route: '/app/ride',
    target: 'nav-ride',
    placement: 'right',
  },
  {
    id: 'smartzdating',
    title: 'SmartzDating',
    description: 'Swipe, match and chat — our full dating experience with smart matching based on shared interests.',
    route: '/app/discover',
    target: 'discover-card-stack',
    placement: 'top',
  },
  {
    id: 'help-support',
    title: 'Help & Support',
    description: "Have a question or an issue? Browse our FAQ or contact support anytime from here — and you can replay this tour whenever you like.",
    route: '/app/help',
    target: 'nav-help',
    placement: 'right',
  },
]
