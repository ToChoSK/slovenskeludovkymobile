// Simplified SVG path data for Slovak historical regions
// ViewBox: 0 0 900 380
// Paths are approximate polygon shapes representing geographic positions

export type RegionPathData = {
  d: string
  viewBox: string
  labelX: number
  labelY: number
}

export const REGION_PATHS: Record<string, RegionPathData> = {
  zahorie: {
    d: "M 0,110 L 88,95 L 95,140 L 90,210 L 82,270 L 70,310 L 0,310 Z",
    viewBox: "0 0 900 380",
    labelX: 38,
    labelY: 210,
  },
  hornepovazie: {
    d: "M 88,95 L 155,50 L 190,60 L 200,100 L 195,150 L 160,160 L 120,155 L 95,140 Z",
    viewBox: "0 0 900 380",
    labelX: 148,
    labelY: 110,
  },
  myjava: {
    d: "M 82,270 L 90,210 L 120,200 L 145,220 L 140,275 L 110,285 Z",
    viewBox: "0 0 900 380",
    labelX: 112,
    labelY: 248,
  },
  kysuce: {
    d: "M 155,50 L 230,30 L 275,55 L 265,100 L 225,115 L 190,110 L 190,60 Z",
    viewBox: "0 0 900 380",
    labelX: 215,
    labelY: 75,
  },
  orava: {
    d: "M 230,30 L 320,10 L 375,30 L 370,75 L 330,90 L 275,90 L 265,55 Z",
    viewBox: "0 0 900 380",
    labelX: 300,
    labelY: 52,
  },
  turiec: {
    d: "M 265,100 L 275,90 L 330,90 L 370,100 L 365,145 L 330,160 L 295,165 L 265,150 L 255,130 Z",
    viewBox: "0 0 900 380",
    labelX: 315,
    labelY: 128,
  },
  liptov: {
    d: "M 370,75 L 375,30 L 450,20 L 520,35 L 530,80 L 495,105 L 450,110 L 420,105 L 390,110 L 365,100 Z",
    viewBox: "0 0 900 380",
    labelX: 450,
    labelY: 65,
  },
  spis: {
    d: "M 520,35 L 590,25 L 640,45 L 650,95 L 620,120 L 570,130 L 530,115 L 495,105 L 530,80 Z",
    viewBox: "0 0 900 380",
    labelX: 575,
    labelY: 78,
  },
  saris: {
    d: "M 640,45 L 710,35 L 780,50 L 800,90 L 790,130 L 750,145 L 700,145 L 660,135 L 650,95 Z",
    viewBox: "0 0 900 380",
    labelX: 720,
    labelY: 90,
  },
  zemplin: {
    d: "M 780,50 L 860,60 L 900,100 L 900,180 L 870,200 L 830,210 L 800,200 L 790,165 L 800,130 L 790,90 Z",
    viewBox: "0 0 900 380",
    labelX: 843,
    labelY: 138,
  },
  abov: {
    d: "M 750,145 L 800,130 L 790,165 L 800,200 L 780,230 L 740,240 L 710,230 L 700,200 L 700,165 Z",
    viewBox: "0 0 900 380",
    labelX: 748,
    labelY: 193,
  },
  gemer: {
    d: "M 570,130 L 620,120 L 650,130 L 660,165 L 700,165 L 700,200 L 710,230 L 680,255 L 630,260 L 580,245 L 550,220 L 545,185 L 555,160 Z",
    viewBox: "0 0 900 380",
    labelX: 628,
    labelY: 195,
  },
  horehronie: {
    d: "M 365,145 L 370,100 L 390,110 L 420,105 L 450,110 L 465,150 L 460,195 L 430,210 L 395,210 L 365,200 Z",
    viewBox: "0 0 900 380",
    labelX: 415,
    labelY: 163,
  },
  podpolanie: {
    d: "M 460,195 L 465,150 L 495,155 L 530,165 L 545,185 L 550,220 L 520,235 L 490,230 L 465,220 Z",
    viewBox: "0 0 900 380",
    labelX: 505,
    labelY: 193,
  },
  malohont: {
    d: "M 430,210 L 460,195 L 465,220 L 490,230 L 490,255 L 460,265 L 430,255 L 415,238 Z",
    viewBox: "0 0 900 380",
    labelX: 456,
    labelY: 232,
  },
  novohrad: {
    d: "M 415,238 L 430,255 L 460,265 L 470,290 L 440,305 L 405,300 L 385,280 L 390,258 Z",
    viewBox: "0 0 900 380",
    labelX: 428,
    labelY: 273,
  },
  hont: {
    d: "M 340,255 L 365,240 L 390,258 L 385,280 L 405,300 L 390,320 L 355,325 L 330,310 L 325,285 Z",
    viewBox: "0 0 900 380",
    labelX: 366,
    labelY: 285,
  },
  pohronie: {
    d: "M 295,165 L 330,160 L 365,145 L 365,200 L 395,210 L 390,230 L 365,240 L 340,255 L 310,250 L 285,230 L 280,200 Z",
    viewBox: "0 0 900 380",
    labelX: 333,
    labelY: 207,
  },
  povazie: {
    d: "M 195,150 L 225,115 L 265,150 L 280,200 L 285,230 L 250,245 L 220,240 L 195,225 L 180,200 L 180,165 Z",
    viewBox: "0 0 900 380",
    labelX: 233,
    labelY: 193,
  },
  tekov: {
    d: "M 145,220 L 160,195 L 180,165 L 195,225 L 220,240 L 215,270 L 190,280 L 165,270 L 140,255 Z",
    viewBox: "0 0 900 380",
    labelX: 183,
    labelY: 245,
  },
  ponitrie: {
    d: "M 120,155 L 160,160 L 195,150 L 180,165 L 160,195 L 145,220 L 120,220 L 95,205 L 90,175 L 100,155 Z",
    viewBox: "0 0 900 380",
    labelX: 140,
    labelY: 185,
  },
  podunajsko: {
    d: "M 70,310 L 82,270 L 110,285 L 140,275 L 165,270 L 190,280 L 215,270 L 220,300 L 215,335 L 190,350 L 120,355 L 60,345 Z",
    viewBox: "0 0 900 380",
    labelX: 148,
    labelY: 320,
  },
}

// Map viewBox for displaying all regions together
export const SLOVAKIA_MAP_VIEWBOX = "0 0 900 380"
