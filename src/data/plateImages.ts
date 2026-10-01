/**
 * The plates whose images have been added, as web-sized JPEGs made from
 * the originals in the media zips (at most 1800px on the long edge).
 *
 * A plate the post builds from several photographs carries them all in
 * `set`, in the post's order; `src` is the first of them, for share cards.
 *
 * Missing: plate 33 was in the fourth zip, which was cut off in upload. It
 * shows its caption without an image until it is added here. (Plates 35 and
 * 38, from the same zip, were supplied on 2026-10-01.)
 */
export type PlateImage = { src: string; width: number; height: number };

export const plateImages: Record<string, PlateImage & { set?: PlateImage[] }> = {
  "plate-01": { src: "/images/plates/plate-01.jpg", width: 356, height: 584 },
  "plate-02": { src: "/images/plates/plate-02.jpg", width: 623, height: 615 },
  "plate-03": { src: "/images/plates/plate-03.jpg", width: 1205, height: 845 },
  "plate-04": { src: "/images/plates/plate-04.jpg", width: 605, height: 1042 },
  "plate-05": { src: "/images/plates/plate-05.jpg", width: 490, height: 292 },
  "plate-06": { src: "/images/plates/plate-06.jpg", width: 738, height: 366 },
  "plate-07": { src: "/images/plates/plate-07.jpg", width: 747, height: 1024 },
  "plate-08": { src: "/images/plates/plate-08.jpg", width: 377, height: 728 },
  "plate-09": { src: "/images/plates/plate-09.jpg", width: 962, height: 1427 },
  "plate-10": { src: "/images/plates/plate-10.jpg", width: 901, height: 1320 },
  "plate-11": { src: "/images/plates/plate-11.jpg", width: 813, height: 1310 },
  // Plate 12 is the family's own Kodachrome scan (Frank Calicura Collection),
  // sharper than the post's copy, which is mirrored.
  "plate-12": { src: "/images/plates/plate-12.jpg", width: 1237, height: 1800 },
  // Plate 13 is five photographs of the Ideal Hotel's building, "Various
  // sources" as the post says, at the size the post shows them.
  "plate-13": {
    src: "/images/plates/plate-13-1.jpg",
    width: 243,
    height: 223,
    set: [
      { src: "/images/plates/plate-13-1.jpg", width: 243, height: 223 },
      { src: "/images/plates/plate-13-2.jpg", width: 320, height: 199 },
      { src: "/images/plates/plate-13-3.jpg", width: 319, height: 174 },
      { src: "/images/plates/plate-13-4.png", width: 320, height: 181 },
      { src: "/images/plates/plate-13-5.png", width: 320, height: 203 },
    ],
  },
  "plate-14": { src: "/images/plates/plate-14.jpg", width: 1058, height: 837 },
  "plate-15": { src: "/images/plates/plate-15.jpg", width: 865, height: 906 },
  "plate-16": { src: "/images/plates/plate-16.jpg", width: 772, height: 1003 },
  "plate-17": { src: "/images/plates/plate-17.jpg", width: 743, height: 425 },
  "plate-18": { src: "/images/plates/plate-18.jpg", width: 266, height: 1485 },
  "plate-19": { src: "/images/plates/plate-19.jpg", width: 668, height: 571 },
  "plate-20": { src: "/images/plates/plate-20.jpg", width: 661, height: 480 },
  "plate-21": { src: "/images/plates/plate-21.jpg", width: 1408, height: 614 },
  "plate-22": { src: "/images/plates/plate-22.jpg", width: 672, height: 882 },
  "plate-23": { src: "/images/plates/plate-23.jpg", width: 448, height: 1002 },
  "plate-24": { src: "/images/plates/plate-24.jpg", width: 657, height: 745 },
  "plate-25": { src: "/images/plates/plate-25.jpg", width: 1018, height: 637 },
  "plate-26": { src: "/images/plates/plate-26.jpg", width: 505, height: 800 },
  "plate-27": { src: "/images/plates/plate-27.jpg", width: 161, height: 189 },
  "plate-28": { src: "/images/plates/plate-28.jpg", width: 128, height: 187 },
  "plate-29": { src: "/images/plates/plate-29.jpg", width: 819, height: 716 },
  "plate-30": { src: "/images/plates/plate-30.jpg", width: 751, height: 1214 },
  // Plate 31: the press print (Historic Images), front and back. The back's
  // handwritten caption and "Return to Chronicle Files" stamp are what the
  // post quotes. The front's source scan was not confirmed when it was
  // added (2026-10-01); it was added at the site owner's request.
  "plate-31": {
    src: "/images/plates/plate-31-front.jpg",
    width: 640,
    height: 409,
    set: [
      { src: "/images/plates/plate-31-front.jpg", width: 640, height: 409 },
      { src: "/images/plates/plate-31-back.jpg", width: 640, height: 751 },
    ],
  },
  "plate-32": { src: "/images/plates/plate-32.jpg", width: 217, height: 491 },
  "plate-34": { src: "/images/plates/plate-34.jpg", width: 288, height: 191 },
  "plate-35": { src: "/images/plates/plate-35.png", width: 476, height: 515 },
  "plate-36": { src: "/images/plates/plate-36.jpg", width: 1024, height: 640 },
  "plate-37": { src: "/images/plates/plate-37.jpg", width: 596, height: 648 },
  "plate-38": { src: "/images/plates/plate-38.jpg", width: 568, height: 330 },
  // Plate 39 is the family's own Kodachrome scan (Frank Calicura Collection).
  "plate-39": { src: "/images/plates/plate-39.jpg", width: 1800, height: 1393 },
};
