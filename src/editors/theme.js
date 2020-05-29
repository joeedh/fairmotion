import {CSSFont} from "../path.ux/scripts/core/ui_theme.js";
import * as util from '../path.ux/scripts/util/util.js';

export const theme = {
  base:  {
    AreaHeaderBG            : 'rgba(65, 65, 65, 1.0)',
    BasePackFlag            : 0,
    BoxBG                   : 'rgba(100,100,100, 0.558404961947737)',
    BoxBorder               : 'rgba(196,196,196, 1)',
    BoxDepressed            : 'rgba(43,32,27, 0.7410558240167026)',
    BoxDrawMargin           : 2,
    BoxHighlight            : 'rgba(125, 195, 225, 1.0)',
    BoxMargin               : 4,
    BoxRadius               : 12,
    BoxSub2BG               : 'rgba(55, 55, 55, 1.0)',
    BoxSubBG                : 'rgba(75, 75, 75, 1.0)',
    DefaultPanelBG          : 'rgba(75, 75, 75, 1.0)',
    DefaultText             : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 10,
      color   : 'rgba(215, 215, 215, 1.0)'
    }),
    Disabled                : {
      AreaHeaderBG : 'rgb(72, 72, 72)',
      BoxBG : 'rgb(50, 50, 50)',
      BoxSub2BG : 'rgb(50, 50, 50)',
      BoxSubBG : 'rgb(50, 50, 50)',
      DefaultPanelBG : 'rgb(72, 72, 72)',
      InnerPanelBG : 'rgb(72, 72, 72)',
      'background-color' : 'rgb(72, 72, 72)',
      'background-size' : '5px 3px',
      'border-radius' : '15px',
    },
    FocusOutline            : 'rgba(100, 150, 255, 1.0)',
    HotkeyText              : new CSSFont({
      font    : 'courier',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(230, 230, 230, 1.0)'
    }),
    InnerPanelBG            : 'rgba(85, 85, 85, 1.0)',
    LabelText               : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(215, 215, 215, 1.0)'
    }),
    NoteBG                  : 'rgba(220, 220, 220, 0.0)',
    NoteText                : new CSSFont({
      font    : 'sans-serif',
      weight  : 'bold',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(235, 235, 235, 1.0)'
    }),
    ProgressBar             : 'rgba(75, 175, 255, 1.0)',
    ProgressBarBG           : 'rgba(110, 110, 110, 1.0)',
    ScreenBorderInner       : 'rgba(120, 120, 120, 1.0)',
    ScreenBorderMousePadding: 5,
    ScreenBorderOuter       : 'rgba(120, 120, 120, 1.0)',
    ScreenBorderWidth       : 2,
    TitleText               : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(215, 215, 215, 1.0)'
    }),
    ToolTipText             : new CSSFont({
      font    : 'sans-serif',
      weight  : 'bold',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(35, 35, 35, 1.0)'
    }),
    defaultHeight           : 24,
    defaultWidth            : 24,
    mobileSizeMultiplier    : 2,
    mobileTextSizeMultiplier: 1.5,
    numslider_height        : 20,
    numslider_width         : 20,
    oneAxisMargin           : 6,
    oneAxisPadding          : 6,
    themeVersion            : 0.1,
  },

  button:  {
    BoxMargin    : 7.491595625232676,
    defaultHeight: 24,
    defaultWidth : 100,
  },

  checkbox:  {
    BoxMargin: 2,
    CheckSide: 'left',
  },

  colorfield:  {
    circleSize    : 4,
    colorBoxHeight: 24,
    defaultHeight : 200,
    defaultWidth  : 200,
    fieldsize     : 32,
    hueheight     : 24,
  },

  colorpickerbutton:  {
    defaultFont  : 'LabelText',
    defaultHeight: 25,
    defaultWidth : 100,
  },

  console:  {
    DefaultText: new CSSFont({
      font    : 'monospace',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 18,
      color   : 'rgba(225, 225, 225, 1.0)'
    }),
  },

  curvewidget:  {
    CanvasBG    : 'rgba(50, 50, 50, 0.75)',
    CanvasHeight: 256,
    CanvasWidth : 256,
  },

  dopesheet:  {
    DefaultText    : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 10,
      color   : 'rgba(209,209,209, 1)'
    }),
    TreeText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(207,207,207, 1)'
    }),
    boxSize        : 14,
    keyBorder      : 'rgba(255,255,240, 0.4038793037677633)',
    keyBorderWidth : 1.0403650286511763,
    keyColor       : 'rgba(82,82,82, 1)',
    keyHighlight   : 'rgba(195,159,136, 1)',
    keySelect      : 'rgba(83,109,255, 1)',
    lineMajor      : 'rgba(255, 255, 255, 0.5)',
    lineMinor      : 'rgba(50, 50, 50, 1.0)',
    timeLine       : "rgba(50, 150, 255, 0.75)",
    lineWidth      : 1,
    textShadowColor: 'rgba(131,77,56, 1)',
    textShadowSize : 5.048919110763356,
    treeHeight     : 600,
    treeWidth      : 100,
  },


  dropbox:  {
    BoxHighlight : 'rgba(155, 220, 255, 0.4)',
    defaultHeight: 19.508909279310238,
    dropTextBG   : 'rgba(38,22,15, 0)',
  },

  iconbutton:  {
  },

  iconcheck:  {
  },

  listbox:  {
    DefaultPanelBG: 'rgba(81,81,81, 1)',
    ListActive    : 'rgba(49,39,35, 1)',
    ListHighlight : 'rgba(55,112,226, 0.3637933139143319)',
    height        : 200,
    width         : 110,
  },

  menu:  {
    MenuBG       : 'rgba(40,40,40, 1)',
    MenuBorder   : '1px solid grey',
    MenuHighlight: 'rgba(171,171,171, 0.28922413793103446)',
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey;
    `,
    MenuSpacing  : 0,
    MenuText     : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(238,238,238, 1)'
    }),
  },

  numslider:  {
    DefaultText  : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'white'
    }),
    defaultHeight: 22.76656831702612,
    defaultWidth : 100,
  },

  numslider_simple:  {
    BoxBG        : 'rgb(225, 225, 225)',
    BoxBorder    : 'rgb(75, 75, 75)',
    BoxRadius    : 5,
    DefaultHeight: 18,
    DefaultWidth : 135,
    SlideHeight  : 10,
    TextBoxWidth : 45,
    TitleText    : new CSSFont({
      font    : undefined,
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 14,
      color   : undefined
    }),
    labelOnTop   : false,
  },

  panel:  {
    Background      : 'rgba(38,22,15, 0.2642241905475485)',
    BoxBorder       : 'rgba(91,91,91, 1)',
    BoxLineWidth    : 0.9585563201850567,
    BoxRadius       : 5,
    TitleBackground : 'rgba(126,178,237, 0.309051618904903)',
    TitleBorder     : 'rgba(136,136,136, 1)',
    'border-style'  : 'inset',
    'padding-bottom': undefined,
    'padding-top'   : undefined,
  },

  richtext:  {
    DefaultText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 16,
      color   : 'rgba(35, 35, 35, 1.0)'
    }),
    'background-color': undefined,
  },

  scrollbars:  {
    border  : 'rgba(125,125,125, 1)',
    color   : 'rgba(56,56,56, 1)',
    color2  : '#505050',
    contrast: 'rgba(75,38,38, 1)',
    width   : 15,
  },


  tabs:  {
    TabHighlight   : 'rgba(50, 50, 50, 0.2)',
    TabInactive    : 'rgba(130, 130, 150, 1.0)',
    TabStrokeStyle1: 'rgba(200, 200, 200, 1.0)',
    TabStrokeStyle2: 'rgba(255, 255, 255, 1.0)',
    TabText        : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 18,
      color   : 'rgba(215, 215, 215, 1.0)'
    }),
  },

  textbox:  {
    'background-color': undefined,
  },

  tooltip:  {
    BoxBG    : 'rgb(245, 245, 245, 1.0)',
    BoxBorder: 'rgb(145, 145, 145, 1.0)',
  },

  treeview:  {
    itemIndent: 10,
    rowHeight : 18,
  },

};
