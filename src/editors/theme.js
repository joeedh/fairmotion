import {CSSFont} from "../path.ux/scripts/core/ui_theme.js";
import * as util from '../path.ux/scripts/util/util.js';

export const theme = {
  base:  {
    AreaHeaderBG            : 'rgba(65, 65, 65, 1.0)',
    BasePackFlag            : 0,
    BoxBG                   : 'rgba(100, 100, 100, 1.0)',
    BoxBorder               : 'rgba(155, 155, 155, 1.0)',
    BoxDepressed            : 'rgba(43,32,27, 1)',
    BoxDrawMargin           : 2,
    BoxHighlight            : 'rgba(125, 195, 225, 1.0)',
    BoxMargin               : 4,
    BoxRadius               : 12,
    BoxSub2BG               : 'rgba(55, 55, 55, 1.0)',
    BoxSubBG                : 'rgba(75, 75, 75, 1.0)',
    DefaultPanelBG          : 'rgba(75, 75, 75, 1.0)',
    DefaultText             : new CSSFont({
      font    : 'sans-serif',
      weight  : 'bold',
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
      weight  : 'bold',
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
      weight  : 'bold',
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
    BoxMargin    : 10,
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
    treeHeight: 600,
    treeWidth : 100,
  },

  dropbox:  {
    BoxHighlight : 'rgba(155, 220, 255, 0.4)',
    defaultHeight: 24,
    dropTextBG   : 'rgba(55, 55, 55, 0.7)',
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
    MenuBG       : 'rgba(250, 250, 250, 1.0)',
    MenuBorder   : '1px solid grey',
    MenuHighlight: 'rgba(155, 220, 255, 1.0)',
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey;
    `,
    MenuText     : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(25, 25, 25, 1.0)'
    }),
  },

  numslider:  {
    DefaultText  : new CSSFont({
      font    : 'sans-serif',
      weight  : 'bold',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'white'
    }),
    defaultHeight: 20,
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
    BoxBorder       : 'rgba(93,93,93, 1)',
    BoxLineWidth    : 1.0344999886868282,
    BoxRadius       : 5,
    TitleBackground : 'rgba(99,99,99, 1)',
    TitleBorder     : 'rgba(143,143,143, 1)',
    'border-style'  : 'solid',
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
    border  : undefined,
    color   : undefined,
    color2  : undefined,
    contrast: undefined,
    width   : undefined,
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
