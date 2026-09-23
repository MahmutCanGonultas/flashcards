/**
 * The grammar topics of Kartlarım: the learner's own list, from "to be" to
 * the future. Every English line can carry colour marks, read by
 * components/Rich.tsx:
 *
 *   {am}      the form the topic is about        green
 *   [I]       what decides it (subject, noun…)   blue
 *   <every day> a third part worth seeing       orange
 *   **word**  bold
 *
 * Each topic says in its `legend` what its colours mean, so a green word
 * always means something the learner has been told.
 */

export type Level = "beginner" | "elementary" | "pre-intermediate";

/** The bright families (index.css); a level or a table header wears one. */
export type Tone = "grass" | "ocean" | "berry" | "sunny" | "tangerine" | "plum" | "teal" | "rose";

export type Example = {
  /** English, with colour marks. */
  en: string;
  /** Its natural Turkish (plain, or with the same marks around the counterpart). */
  tr: string;
};

export type Table = {
  /** Header cells; marks allowed. */
  head: string[];
  rows: string[][];
  /** A line under the table. */
  caption?: string;
};

export type Section = {
  title: string;
  /** Turkish explanation; marks allowed. */
  body?: string;
  table?: Table;
  examples?: Example[];
  /** A small yellow note under the section. */
  note?: string;
};

export type Mistake = {
  wrong: string;
  right: string;
  /** Why, in Turkish. */
  why: string;
};

export type Question =
  | {
      kind: "choice";
      /** The sentence with ___ where the answer goes (or a plain question). */
      prompt: string;
      /** Its Turkish, shown under it. */
      tr?: string;
      options: string[];
      /** Index of the right option. */
      answer: number;
      explain: string;
    }
  | {
      kind: "type";
      prompt: string;
      tr?: string;
      /** Every accepted answer; the first is the one shown. */
      answer: string[];
      explain: string;
    }
  | {
      kind: "order";
      /** The Turkish to be put into English. */
      tr: string;
      /** The right sentence; its words are the tiles. */
      answer: string;
      /** Other accepted sentences. */
      also?: string[];
      /** Wrong tiles mixed in. */
      extra?: string[];
      explain: string;
    };

export type TopicMeta = {
  slug: string;
  level: Level;
  title: string;
  titleTr: string;
  /** One emoji on the topic's badge. */
  emoji: string;
};

export type TopicBody = {
  /** Tonton's opening line: why this matters, in one or two sentences. */
  intro: string;
  /** What the colour marks mean on this topic's page. */
  legend?: { focus?: string; partner?: string; extra?: string };
  sections: Section[];
  mistakes: Mistake[];
  /** Tonton's memory trick. */
  tip: string;
  quiz: Question[];
};

export type Topic = TopicMeta & TopicBody;
