/** Edit friend names + the birthday letter here. */

export const content = {
  title: "Angie's Freebies",
  mission: 'Catch as much free stuff as possible',

  helmetPhoto: '/media/angie-face.jpg',

  planetPhotos: [
    { src: '/media/planet-1.jpg', name: 'Planet Nap' },
    { src: '/media/planet-2.jpg', name: 'Planet Snack' },
    { src: '/media/planet-3.jpg', name: 'Planet Chaos' },
  ],

  introVideo: {
    src: '/media/final-transmission.mp4',
    caption: 'Final transmission',
  },

  /** Freebies = friends. Fly into someone to pick them up, or dodge to skip. */
  friends: [
    { id: 'hajar', name: 'Hajar' },
    { id: 'julian', name: 'Julian' },
    { id: 'deedee', name: 'Deedee' },
    { id: 'tia', name: 'Tia' },
    { id: 'jan', name: 'Jan' },
    { id: 'charis', name: 'Charis' },
    { id: 'jonsch', name: 'Jonsch' },
    { id: 'lily', name: 'Lily' },
    { id: 'creepy', name: 'Creepy the Creep' },
    { id: 'tobias', name: 'Tobias' },
    { id: 'sofiia', name: 'Sofiia' },
    { id: 'yoanna', name: 'Yoanna' },
    { id: 'viona', name: 'Viona' },
    { id: 'nadia', name: 'Nadia' },
    { id: 'monika', name: 'Monika' },
    { id: 'michael-maker', name: 'Michael Maker' },
    { id: 'adam', name: 'Adam' },
    { id: 'vvvv', name: 'vvvv bonus' },
  ],

  birthdayMessage: `Angelina,

you are one of the nicest people I know.
you make everyone around you feel special,
like they matter, like they’re seen.

you’re also one of the funniest people I know.
you walk into a room and somehow it gets lighter.

I’m really grateful for you.
for your kindness, your humor, your heart.
happy birthday. you deserve all the soft things and all the loud laughs.

I made this little game for you.
hope it made you smile.`,

  roasts: [
    'oops cake',
    'watch the frosting',
    'almost got you',
    'keep going',
    'nice dodge almost',
  ],

  pickupLines: [
    'got them',
    'yes!',
    'in the bag',
    'nice',
    'come through',
  ],

  skipLines: [
    'skipped',
    'maybe later',
    'not this time',
    'left behind',
  ],

  bombLines: [
    'BOOM',
    'that was a bomb',
    'ouch',
    'do not eat that',
    'bad freebie',
  ],

  runDuration: 95,

  scrollSpeed: 7.4,
  scrollAccel: 0.035,

  friendGap: 3.1,
} as const

export type FriendDef = (typeof content.friends)[number]
