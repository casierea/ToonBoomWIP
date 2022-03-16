/*
 mcPoint2dInterpolation.js
 Version: 1.08
 Date (DD-MM-YYYY): 27/02/2019

 Description: The MasterController creation script.
              This script can be used after the interpolation grid data is saved to
              a .tbstate file.

 Copyright (C) 2019 Toon Boom Animation Inc.
 https://www.toonboom.com/legal/terms-and-conditions
*/
var stateLib         = require(specialFolders.resource+"/scripts/utilities/state/TB_StateManager.js");
var stateGridUtilLib = require(specialFolders.resource+"/scripts/utilities/ui/interpolationGrid/TB_StateGridHelper.js");
var interpolationCommonLib = require(specialFolders.resource+"/scripts/utilities/ui/TB_InterpolationCommonUtils.js");

function createCameraViewPointWidget()
{
  var colorValue   = node.getAttr(Controller.node, frame.current(), "widget_color").colorValueAt(frame.current());
  var sizeValue    = node.getAttr(Controller.node, frame.current(), "widget_size").doubleValue();
  var posAttr      = node.getAttr(Controller.node, frame.current(), "widget_pos");
  var showLimValue = node.getAttr(Controller.node, frame.current(), "show_limits").boolValue();

  var minMaxY = g_stateInterpolator.getURange();
  var minMaxX = g_stateInterpolator.getVRange();
  var initialPos = Point2d((minMaxX[0]+minMaxX[1])/2,
                           (minMaxY[0]+minMaxY[1])/2);
  var wid = new Point2dWidget( { data : posAttr,
                                 xmin : minMaxX[0],
                                 ymin : minMaxY[0],
                                 xmax : minMaxX[1],
                                 ymax : minMaxY[1],
                                 size : sizeValue,
                                 show_limits : showLimValue,
                                 inner_color : colorValue,
                                 selection_color : ColorRGBA(255,255,255),
                                 outer_color : ColorRGBA(0,0,0) } );
  
  //Capture global variables.
  var stateInterpolatorCapture = g_stateInterpolator;
  
  //Widget value change callback (when the point is moved)
  wid.valueChanged.connect( function(pt2d)
  {
    var u = pt2d.y;
    var v = pt2d.x;
    var interpolatedState = stateInterpolatorCapture.interpolate(u,v);
    interpolatedState.applyState(frame.current());
    Action.performForEach("onActionInvalidateCanvas","cameraView");
  });

  return wid;
}

function loadInterpolationStates(){
  var uiDataAttr = node.getAttr(Controller.node,frame.current(),"uiData");
  var uiData = JSON.parse(uiDataAttr.textValue());
  
  //example : uiData = {"poses":"/scripts/test1.tbState",
  //                    "location":"scn"}
  function onPreferredLocChanged(newLocation){
    uiData.location = newLocation;
    uiDataAttr.setValue(JSON.stringify(uiData));
  }
  
  function onStateFileLoaded(loadedStates){
    if(loadedStates.length>0)
      g_stateInterpolator = stateGridUtilLib.loadStatesGrid(loadedStates);
  }
  
  interpolationCommonLib.loadMCStateFiles(Controller.node,
                                          stateLib,
                                          [uiData.poses],  //e.g. "/scripts/test1.tbState"
                                          uiData.location, //location key, e.g. "scn"
                                          onPreferredLocChanged,
                                          onStateFileLoaded);
}

//Controller.onFrameChanged = function()
//{
//}

Controller.onShowControl = function()
{
  MessageLog.trace("\n\n\n");
  MessageLog.trace(" ---------------------------------------------------------------------------");
  MessageLog.trace("| " +interpolationCommonLib.mcInterpolationGridFile );
  MessageLog.trace(" ---------------------------------------------------------------------------");
  
  g_stateInterpolator = null;
  loadInterpolationStates();
  
  if(g_stateInterpolator==null)
  {
    MessageLog.trace(translator.tr("Failed to load data."));
    return;
  }
  
  g_widget = createCameraViewPointWidget();
  Controller.controls = [g_widget];
  MessageLog.trace("Done.");
}