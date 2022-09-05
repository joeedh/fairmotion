/*
 * WARNING: AUTO-GENERATED FILE
 *
 * Copy to scripts/editors/theme.js
 */

import {CSSFont} from '../path.ux/scripts/pathux.js';

export const theme = {
  base:  {
    AreaHeaderBG            : 'rgba(38,38,38, 1)',
    BasePackFlag            : 0,
    BoxDepressed            : 'rgba(43,32,27, 0.7410558240167026)',
    BoxDrawMargin           : 2,
    BoxHighlight            : 'rgba(125, 195, 225, 1.0)',
    DefaultText             : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 10,
      color   : 'rgba(235,235,235, 1)'
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
    ScreenBorderInner       : 'rgba(87,87,87, 1)',
    ScreenBorderMousePadding: 5,
    ScreenBorderOuter       : 'rgba(87,87,87, 1)',
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
      color   : 'rgba(218,218,218, 1)'
    }),
    'background-color'      : 'rgba(55, 55, 55, 1.0)',
    'border-color'          : 'rgba(196,196,196, 1)',
    'border-radius'         : 12,
    'border-width'          : 0,
    'flex-grow'             : 'unset',
    'focus-border-color'    : 'rgba(55,155,255, 1)',
    'focus-border-width'    : 2,
    height                  : 24,
    mobileSizeMultiplier    : 2,
    mobileTextSizeMultiplier: 1.5,
    oneAxisMargin           : 6,
    oneAxisPadding          : 6,
    padding                 : 4,
    themeVersion            : 0.1,
    width                   : 24,
  },

  button:  {
    DefaultText        : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgb(252,252,252)'
    }),
    'background-color' : 'rgba(111,111,111, 1)',
    'border-color'     : 'black',
    'border-radius'    : 7,
    'border-style'     : 'solid',
    'border-width'     : 1,
    disabled           : {
      DefaultText : new CSSFont({
        font    : 'poppins',
        weight  : 'bold',
        variant : 'normal',
        style   : 'normal',
        size    : 12,
        color   : 'rgb(109,109,109)'
      }),
      'background-color' : 'rgb(19,19,19)',
      'border-color' : '#f58f8f',
      'border-style' : 'solid',
      'border-width' : 1,
    },
    height             : 20,
    highlight          : {
      'background-color' : 'rgb(164,190,212)',
      'border-color' : 'rgba(163,163,163, 1)',
      'border-radius' : 7,
      'border-style' : 'solid',
      'border-width' : 1,
      height : 20,
      margin : 2,
      'margin-bottom' : 3,
      'margin-left' : 3,
      'margin-right' : 3,
      'margin-top' : 3,
      padding : 1,
      width : 100,
    },
    'highlight-pressed': {
      DefaultText : new CSSFont({
        font    : 'sans-serif',
        weight  : 'normal',
        variant : 'normal',
        style   : 'normal',
        size    : 12,
        color   : 'rgba(255,255,255, 1)'
      }),
      'background-color' : 'rgb(43,62,75)',
      'border-color' : 'rgba(163,163,163, 1)',
      'border-radius' : 7,
      'border-style' : 'solid',
      'border-width' : 1,
      height : 20,
      margin : 2,
      'margin-bottom' : 3,
      'margin-left' : 3,
      'margin-right' : 3,
      'margin-top' : 3,
      padding : 1,
      width : 100,
    },
    margin             : 1,
    'margin-bottom'    : 3,
    'margin-left'      : 3,
    'margin-right'     : 3,
    'margin-top'       : 3,
    padding            : 1,
    pressed            : {
      DefaultText : new CSSFont({
        font    : 'sans-serif',
        weight  : 'normal',
        variant : 'normal',
        style   : 'normal',
        size    : 12,
        color   : 'rgba(255,255,255, 1)'
      }),
      'background-color' : 'rgb(31,31,31)',
      'border-color' : 'rgba(163,163,163, 1)',
      'border-radius' : 7,
      'border-style' : 'solid',
      'border-width' : 1,
      height : 20,
      margin : 2,
      'margin-bottom' : 3,
      'margin-left' : 3,
      'margin-right' : 3,
      'margin-top' : 3,
      padding : 1,
      width : 100,
    },
    width              : 55,
  },

  checkbox:  {
    CheckSide         : 'left',
    'background-color': 'grey',
    'border-color'    : 'black',
    'border-radius'   : 5,
    'border-style'    : 'solid',
    'border-width'    : 1,
    height            : 32,
    'margin-bottom'   : 1,
    'margin-left'     : 1,
    'margin-right'    : 1,
    'margin-top'      : 1,
    padding           : 2,
    width             : 32,
  },

  colorfield:  {
    'background-color': 'rgb(181,181,181)',
    circleSize        : 4,
    colorBoxHeight    : 24,
    fieldSize         : 400,
    fieldsize         : 32,
    height            : 200,
    hueHeight         : 32,
    hueheight         : 24,
    width             : 200,
  },

  colorpickerbutton:  {
    'border-radius': 10,
    defaultFont    : 'LabelText',
    height         : 25,
    width          : 75,
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
    CanvasBG          : 'rgba(50, 50, 50, 0.75)',
    CanvasHeight      : 256,
    CanvasWidth       : 256,
    'background-color': 'rgb(181,181,181)',
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
    lineWidth      : 1,
    textShadowColor: 'rgba(131,77,56, 1)',
    textShadowSize : 5.048919110763356,
    timeLine       : 'rgba(50, 150, 255, 0.75)',
    treeHeight     : 600,
    treeWidth      : 100,
  },

  dropbox:  {
    BoxHighlight  : 'rgba(155, 220, 255, 0.4)',
    'border-width': 1,
    dropTextBG    : 'rgba(33,33,33, 0.7812501017252604)',
    height        : 19.508909279310238,
    margin        : 2,
    padding       : 0,
    width         : 32,
  },

  iconbutton:  {
    'background-color': 'rgba(118,118,118, 0.4461)',
    'border-color'    : 'black',
    'border-radius'   : 5,
    'border-width'    : 1,
    depressed         : {
      'background-color' : 'rgba(58,58,58,0.44)',
      'border-color' : 'black',
      'border-radius' : 5,
      'border-width' : 1,
      'margin-bottom' : 2,
      'margin-left' : 2,
      'margin-right' : 2,
      'margin-top' : 1,
    },
    drawCheck         : true,
    height            : 32,
    highlight         : {
      'background-color' : 'rgba(163,204,234,0.65)',
      'border-color' : 'black',
      'border-radius' : 5,
      'border-width' : 1,
      'margin-bottom' : 2,
      'margin-left' : 2,
      'margin-right' : 2,
      'margin-top' : 1,
    },
    'margin-bottom'   : 2,
    'margin-left'     : 2,
    'margin-right'    : 2,
    'margin-top'      : 1,
    padding           : 2,
    width             : 32,
  },

  iconcheck:  {
    'background-color': 'rgba(76,76,76, 0.4461202687230603)',
    'border-color'    : 'rgba(0,0,0, 1)',
    'border-radius'   : 5,
    'border-width'    : 1,
    depressed         : {
      'background-color' : 'rgba(26,26,26, 1)',
      'border-color' : 'rgb(0,0,0)',
      'border-radius' : 5,
      'border-style' : 'solid',
      'border-width' : 1,
      drawCheck : true,
      height : 32,
      'margin-bottom' : 2,
      'margin-left' : 1,
      'margin-right' : 2,
      'margin-top' : 2,
      padding : 2,
      width : 32,
    },
    drawCheck         : true,
    height            : 32,
    highlight         : {
      'background-color' : 'rgba(99,119,142, 1)',
      'border-color' : 'rgba(171,171,171, 1)',
      'border-radius' : 5,
      'border-width' : 1,
      drawCheck : true,
      height : 32,
      'margin-bottom' : 2,
      'margin-left' : 1,
      'margin-right' : 2,
      'margin-top' : 2,
      padding : 2,
      width : 32,
    },
    'margin-bottom'   : 2,
    'margin-left'     : 1,
    'margin-right'    : 2,
    'margin-top'      : 2,
    padding           : 2,
    width             : 32,
  },

  label:  {
    LabelText      : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 14,
      color   : 'rgba(35, 35, 35, 1.0)'
    }),
    'border-radius': 0,
    'border-width' : 0,
  },

  listbox:  {
    ListActive        : 'rgba(49,39,35, 1)',
    ListHighlight     : 'rgba(55,112,226, 0.3637933139143319)',
    'background-color': 'rgba(81,81,81, 1)',
    height            : 200,
    margin            : 1,
    padding           : 1,
    width             : 110,
  },

  menu:  {
    MenuBG          : 'rgba(40,40,40, 1)',
    MenuBorder      : '1px solid grey',
    MenuHighlight   : 'rgba(171,171,171, 0.28922413793103446)',
    MenuSeparator   : `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey;
    `,
    MenuSpacing     : 0,
    MenuText        : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(238,238,238, 1)'
    }),
    'border-color'  : 'grey',
    'border-radius' : 0,
    'border-style'  : 'solid',
    'border-width'  : 1,
    'box-shadow'    : '5px 5px 25px rgba(0,0,0,0.75)',
    'item-radius'   : 0,
    'padding-bottom': 0,
    'padding-left'  : 0,
    'padding-right' : 0,
    'padding-top'   : 0,
  },

  noteframe:  {
    'background-color': 'rgba(220, 220, 220, 0.0)',
    'border-color'    : 'grey',
    'border-radius'   : 5,
    'border-style'    : 'solid',
    'border-width'    : 0,
    margin            : 1,
    padding           : 1,
    width             : 128,
  },

  notification:  {
    DefaultText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(255,255,255, 1)'
    }),
    ProgressBar       : 'rgba(75, 175, 255, 1.0)',
    ProgressBarBG     : 'rgba(110, 110, 110, 1.0)',
    'background-color': 'rgba(72,72,72,0)',
    'border-color'    : 'grey',
    'border-radius'   : 5,
    'border-style'    : 'solid',
    'border-width'    : 1,
  },

  numslider:  {
    DefaultText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'white'
    }),
    'background-color': 'rgba(122,122,122, 1)',
    'border-color'    : 'black',
    'border-radius'   : 8,
    'border-style'    : 'solid',
    'border-width'    : 1,
    height            : 22.76656831702612,
    width             : 100,
  },

  numslider_simple:  {
    SlideHeight       : 10,
    TextBoxWidth      : 45,
    TitleText         : new CSSFont({
      font    : undefined,
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 14,
      color   : 'rgba(229,229,229, 1)'
    }),
    'background-color': 'rgba(102,102,102, 1)',
    'border-color'    : 'rgb(75, 75, 75)',
    'border-radius'   : 5,
    height            : 18,
    labelOnTop        : false,
    width             : 135,
  },

  numslider_textbox:  {
    TextBoxHeight     : 25,
    TextBoxWidth      : 100,
    'background-color': 'rgba(65,65,65, 1)',
    height            : 25,
    labelOnTop        : true,
    width             : 120,
  },

  overdraw:  {
    'background-color': 'rgba(0,0,0,0)',
    'border-width'    : 0,
    margin            : 0,
    padding           : 0,
  },

  panel:  {
    HeaderBorderRadius    : 10,
    HeaderRadius          : 5.829650280441558,
    TitleBackground       : 'rgba(126,178,237, 0.309051618904903)',
    TitleBorder           : 'rgba(136,136,136, 1)',
    TitleText             : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 14,
      color   : 'rgba(229,229,229, 1)'
    }),
    'background-color'    : 'rgba(38,22,15, 0.2642241905475485)',
    'border-color'        : 'rgba(91,91,91, 1)',
    'border-radius'       : 5,
    'border-style'        : 'inset',
    'border-width'        : 0.9585563201850567,
    'margin-bottom'       : 4.762442435166511,
    'margin-bottom-closed': 0,
    'margin-left'         : 0,
    'margin-right'        : 0,
    'margin-top'          : 4,
    'margin-top-closed'   : 0,
    'padding-bottom'      : undefined,
    'padding-left'        : 0,
    'padding-right'       : 0,
    'padding-top'         : undefined,
  },

  popup:  {
    'background-color': 'rgba(70,70,70, 1)',
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

  screenborder:  {
    'border-inner'   : 'grey',
    'border-outer'   : 'rgba(228,228,228, 1)',
    'border-width'   : 2,
    'mouse-threshold': 5,
  },

  scrollbars:  {
    border  : 'rgba(125,125,125, 1)',
    color   : 'rgba(56,56,56, 1)',
    color2  : '#505050',
    contrast: 'rgba(75,38,38, 1)',
    width   : 15,
  },

  sidebar:  {
    'background-color': 'rgba(55, 55, 55, 0.5)',
  },

  strip:  {
    'background-color': 'rgba(75,75,75, 0.33213141025641024)',
    'border-color'    : 'rgba(0,0,0, 0.31325409987877156)',
    'border-radius'   : 8.76503417507447,
    'border-style'    : 'solid',
    'border-width'    : 1,
    'flex-grow'       : 'unset',
    margin            : 2,
    oneAxisPadding    : 2,
    padding           : 1,
  },

  tabs:  {
    TabActive         : 'rgba(86,86,86, 1)',
    TabBarRadius      : 6,
    TabHighlight      : 'rgba(74,74,74, 1)',
    TabInactive       : 'rgba(28,28,34, 1)',
    TabStrokeStyle1   : 'rgba(200, 200, 200, 1.0)',
    TabStrokeStyle2   : 'rgba(255, 255, 255, 1.0)',
    TabText           : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 15,
      color   : 'rgba(215, 215, 215, 1.0)'
    }),
    'background-color': 'rgba(65,65,65, 1)',
    'movable-tabs'    : 'true',
  },

  textbox:  {
    DefaultText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 14,
      color   : 'rgb(229,229,229)'
    }),
    'background-color': 'rgb(28,28,28)',
  },

  tooltip:  {
    ToolTipText       : new CSSFont({
      font    : 'sans-serif',
      weight  : 'normal',
      variant : 'normal',
      style   : 'normal',
      size    : 12,
      color   : 'rgba(215,215,215, 1)'
    }),
    'background-color': 'rgba(52,52,52, 1)',
    'border-color'    : 'rgb(145, 145, 145, 1.0)',
    'border-radius'   : 3,
    'border-style'    : 'solid',
    'border-width'    : 1,
    padding           : 5,
  },

  treeview:  {
    itemIndent: 10,
    rowHeight : 18,
  },

  vecPopupButton:  {
    height : 18,
    margin : 1,
    padding: 3,
    width  : 100,
  },

};
