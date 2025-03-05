import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertScoreSchema } from "@shared/schema";

const texts = {
  octopus: [
    `time home play work day new book read write help desk lamp food cook room door open walk talk stop run jump feel good bad old fun game life road car park tree blue red black white green light dark rain snow sun moon star cloud fish bird dog cat boy girl man yes no big small high low top down left right each many much some`,
    `back side move keep take give find look need want tell know see hear play work help make done time home good life day way word book read page door wall open shut desk lamp food room cook walk talk stop game feel hand head foot face body mind heart`,
    `home time work life book read help desk lamp food room door open walk talk play feel good stop run jump hand head foot face eyes book time work life play help make game done need want tell know see hear look find give take move keep each many much some all none here now then when how who what where why`,
    `apple banana cherry dance enjoy flower garden happen island jungle knowledge lemon orange mango number october purple question river summer travel unique violet window yellow zephyr adventure beautiful creativity discover elephant fantastic`,
    `guitar harmony imagine journey mountain notebook original painting question rainbow sandwich telephone umbrella victory weather xylophone yesterday zigzag apartment butterfly chocolate dinosaur evergreen fantastic giraffe happiness intelligent`,
    `jazzy kangaroo landscape mountain nighttime octopus paradise quasar restaurant sandwich tropical universe volcano waterfall xylophone yearning zealous adventure brilliant creative delightful energetic fascinating gorgeous harmonious`,
    `imagine journey kitchen leisure machine negative opposite positive quickly rainbow sunshine telephone universe vacation whisper xylophone yearbook zealous birthday calendar daughter elephant february government hospital important`,
    `justice knowledge language medicine notebook organize pleasant question remember sunshine tomorrow umbrella valuable website xylophone younger zealous airplane baseball children dinosaur envelope football graduate hospital`,
    `imagine journey kitchen library mountain notebook october possible question remember surprise tomorrow ultimate victory whistle xylophone yesterday zealous airplane building calendar daughter elephant fantastic graphics`,
    `happiness important journey knowledge language mountain notebook operator pleasure question rainbow sunshine tomorrow umbrella victory whisper xylophone younger zealous adventure building calendar daughter elephant fantastic`,
    `garden history inspire journey kitchen library morning nothing outside picture quality rainbow surprise together ultimate victory whistle xylophone yearning zealous airplane bicycle calendar dolphin elephant`,
    `freedom genuine history imagine journey kitchen library mountain notebook operator picture quality rainbow surprise together ultimate victory whistle xylophone yearning zealous adventure bicycle calendar`,
    `diamond elegant fantasy garden history inspire journey kitchen library mountain notebook operator picture quality rainbow surprise together ultimate victory whistle xylophone yearning zealous adventure`,
    `crystal diamond elegant fantasy garden history inspire journey kitchen library mountain notebook operator picture quality rainbow surprise together ultimate victory whistle xylophone yearning zealous`,
    `awesome bicycle crystal diamond elegant fantasy garden history inspire journey kitchen library mountain notebook operator picture quality rainbow surprise together ultimate victory whistle xylophone`,
    `zebra yellow xylophone window violin umbrella turtle submarine rocket quarterback penguin ostrich nightingale mountain leopard kingfisher jaguar iguana hippopotamus giraffe flamingo elephant dolphin cheetah`,
    `ability balance careful diamond elephant freedom generous helpful inspire journey kindness laughter magical natural organic pleasant question reliable sunshine thoughtful umbrella valuable wonderful exciting`,
    `amazing brilliant creative dramatic elegant fantastic generous hilarious incredible joyful knowledgeable luminous magnificent notorious optimistic passionate quiet remarkable stunning terrific unbelievable victorious wonderful`,
    `architect brilliant comedian detective engineer firefighter gardener historian inventor journalist kindergarten librarian musician novelist oceanographer programmer quarterback researcher scientist therapist underwriter veterinarian`,
    `afternoon beautiful challenge discovery elephant fantastic gorgeous happiness important journey knowledge laughter mountain nighttime overcome peaceful question remarkable sunshine tomorrow universe vacation wonderful`,
    `appreciate beautiful challenge difficult engineer favorite gorgeous hilarious important journey kindness laughter magnificent noteworthy overcome powerful question remarkable sunshine tomorrow understand valuable wonderful`,
    `accomplish brilliant challenge determine excellent fantastic gorgeous hilarious important journey kindness laughter magnificent noteworthy overcome powerful question remarkable sunshine tomorrow understand valuable wonderful`,
    `absolutely beautiful completely delightful extremely fantastic gorgeous hilarious important journey kindness laughter magnificent noteworthy overcome powerful question remarkable sunshine tomorrow understand valuable wonderful`,
    `afternoon breakfast champion dinosaur elephant fountain governor hospital important justice knowledge laughter mountain notebook opposite powerful question remember sunshine tomorrow umbrella valuable wonderful`,
    `basketball chocolate dinosaur elephant fantastic gorgeous happiness important journey knowledge language mountain notebook opposite powerful question remember sunshine tomorrow umbrella valuable wonderful exciting`,
    `algorithm beautiful challenge dinosaur elephant fantastic gorgeous happiness important journey knowledge language mountain notebook opposite powerful question remember sunshine tomorrow umbrella valuable zipcode`,
    `adventure beautiful challenge dinosaur elephant fantastic gorgeous happiness important journey knowledge language mountain notebook opposite powerful question remember sunshine tomorrow umbrella valuable zipcode`,
  ],
  dolphin: [
    `The morning sun filtered through the kitchen window as Sarah prepared breakfast for her family. She cracked eggs into the sizzling pan while toast popped up from the toaster, filling the air with a warm, inviting aroma. Her children's footsteps thundered down the stairs, eager to start their day with her homemade pancakes and fresh orange juice. The family cat stretched lazily on the windowsill, watching birds flutter past in the garden outside.`,
    `Tom walked along the beach, feeling the cool water wash over his feet as gentle waves rolled onto the shore. Seagulls circled overhead, their calls mixing with the sound of crashing surf and children's laughter. He collected colorful seashells, carefully placing each treasure in his pocket while watching sailboats glide across the horizon. The salty breeze ruffled his hair as clouds drifted slowly across the bright blue sky.`,
    `Alice tended to her garden in the late afternoon, carefully watering the colorful flowers and vegetables she had planted in spring. Butterflies danced around the blooming roses while bees buzzed busily among the lavender stalks. She smiled as she picked fresh tomatoes and basil for tonight's dinner, enjoying the earthy scent of her thriving garden. A light breeze carried the sweet fragrance of jasmine from the nearby trellis.`,
  ],
  owl: [
    `In the labyrinthine depths of human consciousness, where thoughts interweave with dreams and memories cascade like autumn leaves in a temporal stream, we find ourselves confronting the ineffable nature of existence itself. The philosophical implications of consciousness have perplexed scholars throughout millennia, their contemplations echoing through academic halls and reverberating in the collective intellectual discourse of humanity. As we delve deeper into the neurological substrates of awareness, we discover that the very act of introspection creates ripples in the fabric of our understanding, challenging our preconceptions about the nature of reality and the boundaries of human cognition.`,
    `The quantum mechanical underpinnings of reality present a fascinating paradox: particles existing in superposition until observed, their wave functions collapsing into definite states through the mere act of measurement. This phenomenon, described mathematically through Schrödinger's equations and conceptually through the Copenhagen interpretation, suggests a fundamental interconnectedness between consciousness and the physical world. As we probe deeper into these mysteries, we find ourselves confronting questions that blur the lines between observer and observed, between the quantum realm and our classical understanding of reality.`,
    `The evolution of literary criticism in the post-modern era has led to a profound reconsideration of traditional narrative structures and their relationship to societal power dynamics. Through the lens of deconstructionism, we observe how language itself becomes a battleground for competing interpretations, each text a palimpsest of meanings that simultaneously reveal and obscure deeper truths about the human condition. The author's intent, once considered paramount, now takes its place alongside reader response theory and sociological analysis in a complex web of interpretative frameworks.`,
  ],
};

// Function to fetch appropriate text for each mode
async function getRandomText(mode: string): Promise<string> {
  try {
    const modeTexts = texts[mode as keyof typeof texts];
    if (!modeTexts) {
      throw new Error('Invalid mode');
    }
    return modeTexts[Math.floor(Math.random() * modeTexts.length)];
  } catch (error) {
    throw new Error('Failed to get text');
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.get("/api/text/:mode", async (req, res) => {
    const mode = req.params.mode;
    try {
      const text = await getRandomText(mode);
      res.json({ text });
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch text" });
    }
  });

  app.get("/api/scores/:mode", async (req, res) => {
    const scores = await storage.getTopScores(req.params.mode);
    res.json(scores);
  });

  app.post("/api/scores", async (req, res) => {
    const result = insertScoreSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid score data" });
    }
    const score = await storage.createScore(result.data);
    res.json(score);
  });

  return httpServer;
}