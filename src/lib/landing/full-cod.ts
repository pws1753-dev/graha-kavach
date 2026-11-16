import type { WpLanding } from "@/lib/wordpress/types";
import { isFullCodLanding } from "./routes";

/** Keep payment copy consistent with the campaign's full-COD booking policy. */
export function withLandingPaymentCopy(landing: WpLanding, slug: string): WpLanding {
  if (!isFullCodLanding(slug)) return landing;

  return {
    ...landing,
    ctaLabel: "Book Now — Cash on Delivery",
    ctaSticky: "Book Now · 100% COD",
    heroText: landing.heroText.replace(/Booking सिर्फ़ \{advance\} से।/g, "100% Cash on Delivery — पूरी क़ीमत Kit मिलने पर दें।"),
    nowLabel: "अभी देना है",
    nowNote: "बिना एडवांस बुकिंग",
    laterNote: "पूरी क़ीमत Kit मिलने पर दें",
    ticker: landing.ticker.map((row) => ({
      ...row,
      text: row.text.includes("{advance}") ? "100% Cash on Delivery" : row.text.replace(/बाक़ी \{balance\}/g, "पूरी क़ीमत {price}"),
    })),
    offerPoints: landing.offerPoints.map((row) => ({
      ...row,
      text: row.text.includes("{advance}") ? "बिना एडवांस Booking Confirm, पूरी क़ीमत {price} Delivery पर" : row.text,
    })),
    steps: landing.steps.map((row) => ({
      ...row,
      title: row.title.includes("{advance}") ? "बिना एडवांस आज ही Book करें" : row.title.replace(/बाक़ी \{balance\}/g, "पूरी क़ीमत {price}"),
      text: row.text.includes("{advance}") ? "अपना नाम, मोबाइल नंबर और पता भरें, फिर Cash on Delivery पर Booking Confirm करें।" : row.text,
    })),
    faqs: landing.faqs.map((row) => row.q.includes("{advance}") ? {
      q: "Payment कब करना है?",
      a: "पूरी क़ीमत {price} Kit की Delivery के समय दें। Booking के लिए कोई एडवांस नहीं देना है।",
    } : row),
    payTitle: "Cash on Delivery पर बुकिंग पक्की करें",
    paySecure: "100% Cash on Delivery · कोई एडवांस नहीं",
    doneText: "आपकी Graha Kavach किट आज के ऑफ़र के साथ बुक है: {mrp} की किट {price} में। पूरी क़ीमत डिलीवरी पर दें।",
    doneSteps: landing.doneSteps.map((row) => ({ ...row, text: row.text.replace(/बाक़ी \{balance\}/g, "पूरी क़ीमत {price}") })),
  };
}
