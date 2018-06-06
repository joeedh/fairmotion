"use strict";

import {ColorTheme, ui_weight_clr, BoxColor4} from 'theme';

function uniformbox4(clr) {
  return new BoxColor4([clr, clr, clr, clr]);
}

/*auto-generated file*/
window.UITheme = new ColorTheme({
    "ErrorText" : [1,0.20000000298023224,0.20000000298023224,0.8899999856948853],
    "ListBoxText" : [0.20000000298023224,0.20000000298023224,0.20000000298023224,1],
    "MenuHighlight" : [0.5686200261116028,0.7882000207901001,0.9602000117301941,1],
    "RadialMenu" : [1,0,0,1],
    "RadialMenuHighlight" : [0.7831560373306274,0.7664570808410645,0.3468262255191803,0.7717778086662292],
    "DefaultLine" : [0.4163331985473633,0.3746998906135559,0.3746998906135559,1],
    "SelectLine" : [0.699999988079071,0.699999988079071,0.699999988079071,1],
    "Check" : [0.8999999761581421,0.699999988079071,0.4000000059604645,1],
    "Arrow" : [0.4000000059604645,0.4000000059604645,0.4000000059604645,1],
    "DefaultText" : [0.9092121131323904,0.9092121131323904,0.9092121131323904,1],
    "BoxText" : [0,0,0,1],
    "HotkeyText" : [0.43986162543296814,0.43986162543296814,0.43986162543296814,1],
    "HighlightCursor" : [0.8999999761581421,0.8999999761581421,0.8999999761581421,0.875],
    "TextSelect" : [0.4000000059604645,0.4000000059604645,0.4000000059604645,0.75],
    "TextEditCursor" : [0.10000000149011612,0.10000000149011612,0.10000000149011612,1],
    "TextBoxHighlight" : [0.5270000100135803,0.5270000100135803,0.5270000100135803,1],
    "MenuSep" : [0.6901277303695679,0.6901277303695679,0.6901277303695679,1],
    "MenuBorder" : [0.6499999761581421,0.6499999761581421,0.6499999761581421,1],
    "RadialMenuSep" : [0.10000000149011612,0.20000000298023224,0.20000000298023224,1],
    "TabPanelOutline" : [0.2449489742783178,0.2449489742783178,0.2449489742783178,1],
    "TabPanelBG" : [0.5715476066494082,0.5715476066494082,0.5715476066494082,1],
    "ActiveTab" : [0.5416025603090641,0.5416025603090641,0.5416025603090641,1],
    "HighlightTab" : [0.5686200261116028,0.7882000207901001,0.9602000117301941,0.8999999761581421],
    "InactiveTab" : [0.2449489742783178,0.2449489742783178,0.2449489742783178,1],
    "TabText" : [0.9309493362512627,0.9309493362512627,0.9309493362512627,1],
    "IconBox" : [1,1,1,0.17968888580799103],
    "HighlightIcon" : [0.30000001192092896,0.8149344325065613,1,0.21444444358348846],
    "MenuText" : [0.10000000149011612,0.10000000149011612,0.10000000149011612,1],
    "MenuTextHigh" : [0.9330000281333923,0.9330000281333923,0.9330000281333923,1],
    "PanelText" : [0,0,0,1],
    "DialogText" : [0.05000003054738045,0.05000000447034836,0.05000000447034836,1],
    "DialogBorder" : [0.4000000059604645,0.40000003576278687,0.4000000059604645,1],
    "DisabledBox" : [0.5,0.5,0.5,1],
    "IconCheckBG" : [0.6879922747612,0.6879922747612,0.6879922747612,1],
    "IconCheckSet" : [0.6000000238418579,0.6000000238418579,0.6000000238418579,1],
    "IconCheckUnset" : [0.4464101493358612,0.4464101493358612,0.4464101493358612,1],
    "Highlight" : new BoxColor4([[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1]]),
    "NoteBox" : ui_weight_clr([0.800000011920929,0.800000011920929,0.800000011920929,1],[0.800000011920929,0.800000011920929,0.800000011920929,1]),
    "Box" : ui_weight_clr([0.9399999976158142,0.9399999976158142,0.9399999976158142,1],[0.800000011920929,0.800000011920929,0.800000011920929,1]),
    "HoverHint" : ui_weight_clr([1,0.9769999980926514,0.8930000066757202,0.8999999761581421],[0.8999999761581421,0.8999999761581421,1,1]),
    "ErrorBox" : ui_weight_clr([1,0.30000001192092896,0.20000000298023224,1],[1,1,1,1]),
    "ErrorTextBG" : ui_weight_clr([1,1,1,1],[0.8999999761581421,0.8999999761581421,1,1]),
    "ShadowBox" : ui_weight_clr([0,0,0,0.10000000149011612],[1,1,1,1]),
    "ProgressBar" : ui_weight_clr([0.4000000059604645,0.7300000190734863,0.8999999761581421,0.8999999761581421],[0.75,0.75,1,1]),
    "ProgressBarBG" : ui_weight_clr([0.699999988079071,0.699999988079071,0.699999988079071,0.699999988079071],[1,1,1,1]),
    "WarningBox" : ui_weight_clr([1,0.800000011920929,0.10000000149011612,0.8999999761581421],[0.699999988079071,0.800000011920929,1.0499999523162842,1]),
    "ListBoxBG" : ui_weight_clr([0.9399999976158142,0.9399999976158142,0.9399999976158142,1],[0.9399999976158142,0.9399999976158142,0.9399999976158142,1]),
    "InvBox" : ui_weight_clr([0.6000000238418579,0.6000000238418579,0.6000000238418579,1],[0.6000000238418579,0.6000000238418579,0.6000000238418579,1]),
    "HLightBox" : new BoxColor4([[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1],[0.5686200261116028,0.7882000207901001,0.9602000117301941,1]]),
    "ActivePanel" : ui_weight_clr([0.800000011920929,0.4000000059604645,0.30000001192092896,0.8999999761581421],[1,1,1,1]),
    "CollapsingPanel" : ui_weight_clr([0.687468409538269,0.687468409538269,0.687468409538269,1],[1,1,1,1]),
    "SimpleBox" : ui_weight_clr([0.4760952293872833,0.4760952293872833,0.4760952293872833,1],[0.9399999976158142,0.9399999976158142,0.9399999976158142,1]),
    "DialogBox" : ui_weight_clr([0.7269999980926514,0.7269999980926514,0.7269999980926514,1],[1,1,1,1]),
    "DialogTitle" : ui_weight_clr([0.6299999952316284,0.6299999952316284,0.6299999952316284,1],[1,1,1,1]),
    "MenuBox" : ui_weight_clr([0.9200000166893005,0.9200000166893005,0.9200000166893005,1],[1,1,1,1]),
    "TextBox" : ui_weight_clr([0.800000011920929,0.800000011920929,0.800000011920929,0.8999999761581421],[1,1,1,1]),
    "TextBoxInv" : ui_weight_clr([0.699999988079071,0.699999988079071,0.699999988079071,1],[0.699999988079071,0.699999988079071,0.699999988079071,1]),
    "MenuLabel" : ui_weight_clr([0.9044828414916992,0.8657192587852478,0.8657192587852478,0.24075555801391602],[0.6000000238418579,0.6000000238418579,0.6000000238418579,0.8999999761581421]),
    "MenuLabelInv" : ui_weight_clr([0.75,0.75,0.75,0.47111111879348755],[1,1,0.9410666823387146,1]),
    "ScrollBG" : ui_weight_clr([0.800000011920929,0.800000011920929,0.800000011920929,1],[1,1,1,1]),
    "ScrollBar" : ui_weight_clr([0.5919697284698486,0.5919697284698486,0.5919697284698486,1],[1,1,1,1]),
    "ScrollBarHigh" : ui_weight_clr([0.6548083424568176,0.6548083424568176,0.6548083424568176,1],[1,1,1,1]),
    "ScrollButton" : ui_weight_clr([0.800000011920929,0.800000011920929,0.800000011920929,1],[1,1,1,1]),
    "ScrollButtonHigh" : ui_weight_clr([0.75,0.75,0.75,1],[1,1,1,1]),
    "ScrollInv" : ui_weight_clr([0.4000000059604645,0.4000000059604645,0.4000000059604645,1],[1,1,1,1]),
    "IconInv" : ui_weight_clr([0.48299384117126465,0.5367956161499023,0.8049896955490112,0.4000000059604645],[1,1,1,1])});
  
  
window.View2DTheme = new ColorTheme({
  "Background"   : [1, 1, 1, 1],
  "ActiveObject" : [0.800000011920929,0.6000000238418579,0.30000001192092896,1],
  "Selection" : [0.699999988079071,0.4000000059604645,0.10000000149011612,1],
  "GridLineBold" : [0.38, 0.38, 0.38, 1.0],
  "GridLine" : [0.5, 0.5, 0.5, 1.0],
  "AxisX" : [0.9, 0.0, 0.0, 1.0],
  "AxisY" : [0.0, 0.9, 0.0, 1.0],
  "AxisZ" : [0.0, 0.0, 0.9, 1.0]
});
