/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.2 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
* @class ZaHelpViewController 
* @contructor ZaHelpViewController
* @param appCtxt
* @param container
* @param app
* @author Greg Solovyev
**/
ZaHelpViewController = function(appCtxt, container, app) {

	ZaController.call(this, appCtxt, container, app,"ZaHelpViewController");
	this.tabConstructor = ZaHelpView;
}

ZaHelpViewController.prototype = new ZaController();
ZaHelpViewController.prototype.constructor = ZaHelpViewController;


ZaHelpViewController.prototype.show = 
function(openInNewTab) {
    if (!this._contentView) {
		var elements = new Object();
		this._contentView = new this.tabConstructor(this._container, this._app);
		elements[ZaAppViewMgr.C_APP_CONTENT] = this._contentView;
		var tabParams = {
			openInNewTab: false,
			tabId: this.getContentViewId(),
			tab: this.getMainTab() 
		}
		//this._app.createView(ZaZimbraAdmin._HELP_VIEW, elements);
		this._app.createView(this.getContentViewId(), elements, tabParams) ;
		this._UICreated = true;
		this._app._controllers[this.getContentViewId ()] = this ;
	}
	//this._app.pushView(ZaZimbraAdmin._HELP_VIEW);
	this._app.pushView(this.getContentViewId());
	
	/*
	if (openInNewTab) {//when a ctrl shortcut is pressed
		
	}else{ //open in the main tab
		this.updateMainTab ("Help", ZaMsg.Help_view_title ) ;	
	} */
};
