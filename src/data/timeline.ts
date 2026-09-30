/**
 * Dated events, each quoted from the post and linked back to where the
 * post says it. `when` is the date as the post gives it; `sort` only orders
 * the list. `quote` must appear verbatim in exactly one block (or, for a
 * `plate` entry, in that plate's caption); timeline.test.ts holds this.
 */
export type TimelineEvent = {
  when: string;
  sort: string;
  quote: string;
  /** Set when the event is only in an image caption, not the text. */
  plate?: string;
};

export const timeline: TimelineEvent[] = [
  {
    when: "July 21, 1917",
    sort: "1917-07-21",
    quote:
      "Angelina Jean Colacucio, also later spelled Calicura, was born on July 21, 1917, in Martinez, California.",
  },
  {
    when: "1920",
    sort: "1920",
    quote: "One of the first records Angie appears in is the 1920 US Census",
  },
  {
    when: "1921",
    sort: "1921",
    quote: "Construction on the Towers began in 1921, when Angelina was only four years old.",
  },
  {
    when: "1926",
    sort: "1926",
    quote:
      "In 1926, the *Martinez Daily Standard* listed her among the children attending a seventh birthday party for a local friend.",
  },
  {
    when: "June 11, 1930",
    sort: "1930-06-11",
    quote:
      "On June 11, 1930, the *Martinez Daily Standard* reported that Angelina Calicura had advanced from grammar school into junior high, documenting her formal education.",
  },
  {
    when: "December 8, 1930",
    sort: "1930-12-08",
    quote:
      "Miss Angelina Calicura underwent a major operation at the Martinez Community Hospital today.",
  },
  {
    when: "September 20, 1937",
    sort: "1937-09-20",
    quote:
      'The Honolulu Star-Bulletin arrivals column (September 20, 1937) lists "Miss Angie Calicura"',
  },
  {
    when: "July 5, 1938",
    sort: "1938-07-05",
    quote: "Edna Lee's Beauty Salon No. 2 announces its new owner — **Angie Calicura**",
  },
  {
    when: "April 5, 1940",
    sort: "1940-04-05",
    quote:
      "On April 5, 1940, Angie is listed under the name Jean Calicura on a manifest showing she is traveling from Honolulu, Hawaii, to California, where she arrived by ship on April 12, 1940.",
  },
  {
    when: "April 30, 1940",
    sort: "1940-04-30",
    quote:
      "The 1940 U.S. Census which was taken on April 30, 1940 shows her residence at 596 South Normandie Avenue, Los Angeles, and lists that she was the owner of a beauty shop employing one assistant.",
  },
  {
    when: "1942",
    sort: "1942",
    quote: "But by 1942 she disappears and does not show up again until the 1950s.",
  },
  {
    when: "Early 1950s",
    sort: "1951",
    quote: "By the early 1950s, Angelina was in Montana.",
  },
  {
    when: "March 10, 1952",
    sort: "1952-03-10",
    quote:
      "On March 10, 1952, Jack was mentioned in the *Billings Gazette* in Montana for trap shooting.",
  },
  {
    when: "August 3, 1953",
    sort: "1953-08-03",
    quote:
      "On August 3, 1953, *The Sheridan Press* reported that a hotel license was granted to Angelina Jean Calicura for the Rex Hotel",
  },
  {
    when: "1954",
    sort: "1954",
    quote:
      "Tragedy struck in Sheridan, Wyoming, in 1954. Baby Amato was born and died the same day, only four hours old.",
  },
  {
    when: "March 21, 1955",
    sort: "1955-03-21",
    quote:
      "Sheridan council minutes from March 21, 1955, formally approved the application of Angelina Calicura Amato for a Rooming House License for the Ideal Hotel.",
  },
  {
    when: "February 9, 1956",
    sort: "1956-02-09",
    quote: 'February 9, 1956 – Casper Star-Tribune: "Man held after $460 taken in tavern here.',
  },
  {
    when: "February 14, 1956",
    sort: "1956-02-14",
    quote:
      "Mrs. Angelina J. Calicura was arrested on a charge of vagrancy and released on $100 bail.",
  },
  {
    when: "March 1957",
    sort: "1957-03",
    quote:
      "In March of 1957, Ideal Hotel, Inc. was officially incorporated in Sheridan County, with articles of incorporation filed with the Wyoming Secretary of State in Cheyenne.",
  },
  {
    when: "March 27, 1957",
    sort: "1957-03-27",
    quote:
      "On March 27, 1957 just 20 days after the articles of incorporation were first published, the Sheridan Press published FBI references regarding Angie and her known aliases.",
  },
  {
    when: "April 1, 1957",
    sort: "1957-04-01",
    quote:
      "No commissioner seconded the motion, and the mayor was forced to declare it lost for want of a second",
  },
  {
    when: "April 2, 1957",
    sort: "1957-04-02",
    quote:
      'the *Sheridan Press* reported a dramatic turn in the Ideal Hotel controversy under the bold headline: "City Council Fails to Renew Ideal Hotel Rooming License."',
  },
  {
    when: "April 8, 1957",
    sort: "1957-04-08",
    quote: "With that, the motion carried, and the Ideal Hotel's license was officially restored.",
  },
  {
    when: "April 9, 1957",
    sort: "1957-04-09",
    quote:
      "County Attorney Edward J. Redle publicly criticized the Sheridan City Council for renewing the Ideal Hotel's rooming-house license only a day earlier.",
  },
  {
    when: "March 21, 1958",
    sort: "1958-03-21",
    quote:
      "The revocation was ordered to take effect the very next day—March 21, 1958—bringing Angie's years of legal maneuvering, public controversy, and intermittent victories in Sheridan to an abrupt end.",
  },
  {
    when: "April 15, 1958",
    sort: "1958-04-15",
    quote:
      "On April 15, 1958, a disorderly conduct charge filed against a patron at the Ideal Hotel lists Angelina Calicura as the complainant",
  },
  {
    when: "1958",
    sort: "1958-06",
    quote: "That same year, she appears in the 1958 Billings City Directory listed as:",
  },
  {
    when: "August 28, 1958",
    sort: "1958-08-28",
    quote:
      'On August 28, 1958, Angelina married John Cameron "Jack" Alexander of Billings, Montana, a man fifteen years her junior.',
  },
  {
    when: "December 12, 1958",
    sort: "1958-12-12",
    quote:
      "On December 12, 1958, the paper reported that $1,600 had been stolen from the office safe of local attorney Kenneth Chetwood",
  },
  {
    when: "January 13, 1961",
    sort: "1961-01-13",
    quote:
      'On January 13, 1961, the *Sheridan Press* reported that "Angelina Calicura Alexander fined $50 for disorderly conduct."',
  },
  {
    when: "November 30, 1961",
    sort: "1961-11-30",
    quote:
      "on November 30, 1961, the *Billings Times* recorded a default judgment of $971.34 entered against her",
  },
  {
    when: "November 28, 1963",
    sort: "1963-11-28",
    quote:
      "A Carbon County News legal notice dated November 28, 1963, later confirmed court action involving the couple.",
  },
  {
    when: "December 27, 1963",
    sort: "1963-12-27",
    quote:
      'On December 27, 1963, the *Billings Gazette* carried a striking advertisement announcing a new chapter in her life: "The Hub Beauty Salon," owned by Angie Alexander',
  },
  {
    when: "June 18, 1964",
    sort: "1964-06-18",
    quote:
      'On June 18, 1964, the *Billings Times* reported a civil judgment against "Angelina J. Alexander, dba Wagon Wheel Trailer Court," totaling $645.37 plus interest and costs',
  },
  {
    when: "September 15, 1964",
    sort: "1964-09-15",
    quote:
      "On September 15, 1964, the *Billings Gazette* recorded a traffic fine issued to Angelina Calicura Alexander, age 46, of 2315 Grand Avenue, Billings, for passing a loading school bus.",
  },
  {
    when: "January 14, 1965",
    sort: "1965-01-14",
    quote:
      "On January 14, 1965, she appeared again in Billings police court reporting for careless driving, leaving the scene of an accident, and driving without a license, resulting in multiple fines.",
  },
  {
    when: "April 1, 1965",
    sort: "1965-04-01",
    quote:
      "On April 1, 1965, the *Billings Times* recorded a quitclaim deed transferring land from John C. Alexander to Angelina Alexander",
  },
  {
    when: "June 21, 1965",
    sort: "1965-06-21",
    quote:
      'On June 21, 1965, the *Sheridan Press* published a striking photographic feature under the headline "Down Comes History," marking the physical end of the building that once housed the Ideal Hotel.',
  },
  {
    when: "Mid 1960s",
    sort: "1965-07",
    quote: "The couple relocated to South Lake Tahoe, California, in the mid 1960s",
  },
  {
    when: "1970s",
    sort: "1970",
    quote:
      "**Tarantino's Restaurant (1970s)**: Angelina initially managed this Italian eatery near Takela.",
  },
  {
    when: "June 5, 1972",
    sort: "1972-06-05",
    quote:
      "Angelina and Jack Alexander enjoy dinner in their new restaurant, South Lake Tahoe, June 5, 1972.",
    plate: "plate-31",
  },
  {
    when: "Late 1970s – Early 1980s",
    sort: "1977",
    quote:
      "**Tahoe Inn (Late 1970s – Early 1980s)**: Located at 4110 Lake Tahoe Blvd, now part of Heavenly Village.",
  },
  {
    when: "Early–Mid 1980s",
    sort: "1982",
    quote:
      "**Timber Cove Lodge (Early–Mid 1980s)**: This lakeside lodge allowed Angelina to manage both dining and event operations.",
  },
  {
    when: "December 28, 1986",
    sort: "1986-12-28",
    quote:
      "Angelina passed away on December 28, 1986, in South Lake Tahoe, California, and was laid to rest at Happy Homestead Cemetery, Lake Tahoe.",
  },
  {
    when: "April 20, 2003",
    sort: "2003-04-20",
    quote:
      'Angie\'s husband, John "Jack" Cameron Alexander died on April 20, 2003 in South Lake Tahoe, California.',
  },
];
