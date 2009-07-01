/*
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2006, 2007 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
* This class describes a view of a single resource Account, it will be called during the edit mode
* @class ZaResourceXFormView
* @contructor
* @param parent {DwtComposite}
* @param app {ZaApp}
* @author Greg Solovyev
**/
ZaResourceXFormView = function(parent, app) {
	ZaTabView.call(this, parent, app, "ZaResourceXFormView");	
	this.cosChoices = new XFormChoices([], XFormChoices.OBJECT_LIST, "id", "name");	
	this.initForm(ZaResource.myXModel,this.getMyXForm());
	this._localXForm.setController(this._app);	
	
	this._helpURL = ZaResourceXFormView.helpURL;	
}

ZaResourceXFormView.prototype = new ZaTabView();
ZaResourceXFormView.prototype.constructor = ZaResourceXFormView;
ZaTabView.XFormModifiers["ZaResourceXFormView"] = new Array();
ZaResourceXFormView.TAB_INDEX=0;
ZaResourceXFormView.helpURL = location.pathname + ZaUtil.HELP_URL + "managing_accounts/managing_resource.htm?locid="+AjxEnv.DEFAULT_LOCALE;

ZaResourceXFormView.prototype.getTabIcon =
function () {
	return "Resource" ;
}

/**
* Sets the object contained in the view
* @param entry - {ZaResource} object to display
**/
ZaResourceXFormView.prototype.setObject =
function(entry) {
	this._containedObject = new Object();


	this._containedObject.attrs = new Object();

	for (var a in entry.attrs) {
		if(entry.attrs[a] instanceof Array) {
			this._containedObject.attrs[a] = new Array();
			for(var aa in entry.attrs[a]) {
				this._containedObject.attrs[a][aa] = entry.attrs[a][aa];
			}
		} else {
			this._containedObject.attrs[a] = entry.attrs[a];
		}
	}
	this._containedObject.name = entry.name;
	this._containedObject.type = entry.type ;
	if(entry.id)
		this._containedObject.id = entry.id;
		
	if(ZaSettings.COSES_ENABLED) {	
		
		
		/**
		* If this account does not have a COS assigned to it - assign default COS
		**/
		if(this._containedObject.attrs[ZaResource.A_COSId]) {
			this._containedObject.cos = ZaCos.getCosById(this._containedObject.attrs[ZaResource.A_COSId], this._app);
		}
		
		if(!this._containedObject.cos) {
			this._containedObject.cos = ZaCos.getCosByName("default", this._app);
			this._containedObject[ZaResource.A2_autoCos] = "TRUE" ;
		} else {
			this._containedObject[ZaResource.A2_autoCos] = "FALSE" ;
		}
		if(!this._containedObject.cos) {
			var cosList = this._app.getCosList().getArray();
			/**
			* We did not find the COS assigned to this account,
			* this means that the COS was deleted or wasn't assigned, therefore assign default COS to this account
			**/
			for(var i in cosList) {
				/**
				* Find the COS assigned to this account 
				**/
				if(cosList[i].name == "default") {
					this._containedObject.cos = cosList[i];
					this._containedObject.attrs[ZaResource.A_COSId] = cosList[i].id;										
					break;
				}
			}
			if(!this._containedObject.cos) {
				//default COS was not found - just assign the first COS
				if(cosList && cosList.length > 0) {
					this._containedObject.cos = cosList[0];
					this._containedObject.attrs[ZaResource.A_COSId] = cosList[0].id;					
				}
			}
		}
		if(!this._containedObject.cos) {
			this._containedObject.cos = cosList[0];
		}	
	}
	
	if(ZaSettings.GLOBAL_CONFIG_ENABLED) {
		this._containedObject.globalConfig = this._app.getGlobalConfig();
	}
	
   	this._containedObject[ZaResource.A2_autodisplayname] = "FALSE";
   	this._containedObject[ZaResource.A2_autoLocationName] = entry[ZaResource.A2_autoLocationName];
   	
   	//set the value of the A_schedulePolicy
   	ZaResource.prototype.setSchedulePolicyFromLdapAttrs.call (this._containedObject) ;
   	   				
	if(!entry[ZaModel.currentTab])
		this._containedObject[ZaModel.currentTab] = "1";
	else
		this._containedObject[ZaModel.currentTab] = entry[ZaModel.currentTab];
		
	this._localXForm.setInstance(this._containedObject);
	
	//enforce the dirty = false, so the save button after the save can be disabled.
	this.setDirty(false);
	this.formDirtyLsnr = new AjxListener(ZaApp.getInstance().getCurrentController(), ZaResourceController.prototype.handleXFormChange);
	this._localXForm.addListener(DwtEvent.XFORMS_FORM_DIRTY_CHANGE, this.formDirtyLsnr);
	this._localXForm.addListener(DwtEvent.XFORMS_VALUE_ERROR, this.formDirtyLsnr);	
	
	this.updateTab();
}

ZaResourceXFormView.onCOSChanged = 
function(value, event, form) {
	form.parent.setDirty(true);
	if(ZaItem.ID_PATTERN.test(value))  {
		form.getInstance().cos = ZaCos.getCosById(value, form.parent._app);
		this.setInstanceValue(value);
	} else {
		form.getInstance().cos = ZaCos.getCosByName(value, form.parent._app);
		if(form.getInstance().cos) {
			//value = form.getInstance().cos.id;
			value = form.getInstance().cos.id;
		} 
	}
	this.setInstanceValue(value);
    return value;
}

ZaResourceXFormView.onRepeatRemove = 
function (index, form) {
	var list = this.getInstanceValue();
	if (list == null || typeof(list) == "string" || index >= list.length || index<0) return;
	list.splice(index, 1);
	form.parent.setDirty(true);
}
/**
* This method is added to the map {@link ZaTabView#XFormModifiers}
* @param xFormObject {Object} a definition of the form. This method adds/removes/modifies xFormObject to construct
* an Account view. 
**/
ZaResourceXFormView.myXFormModifier = function(xFormObject) {	

	var domainName;
	if(ZaSettings.DOMAINS_ENABLED && this._app.getDomainList().size() > 0)
		domainName = this._app.getDomainList().getArray()[0].name;
	else 
		domainName = ZaSettings.myDomainName;

	//get the image according to the type
	var imgChoices = [ 	{value:ZaResource.RESOURCE_TYPE_LOCATION, label: "Location_32"},
						{value:ZaResource.RESOURCE_TYPE_EQUIPMENT, label: "Resource_32"}   ];
						
	var headerItems = [	{type:_AJX_IMAGE_, ref:ZaResource.A_zimbraCalResType, src:"Resource_32", label:null, rowSpan:2, choices: imgChoices},
						{type:_OUTPUT_, ref:ZaResource.A_displayname, label:null,cssClass:"AdminTitle", rowSpan:2}];
						
	if(ZaSettings.COSES_ENABLED) {
		headerItems.push({type:_OUTPUT_, ref:ZaResource.A_COSId, labelLocation:_LEFT_, label:ZaMsg.NAD_ClassOfService, choices:this._app.getCosListChoices()});
	}
	if(ZaSettings.SERVERS_ENABLED) {
		headerItems.push({type:_OUTPUT_, ref:ZaResource.A_mailHost, labelLocation:_LEFT_,label:ZaMsg.NAD_MailServer});
	}
	headerItems.push({type:_OUTPUT_,  ref:ZaResource.A_accountStatus, label:ZaMsg.NAD_ResourceStatus, labelLocation:_LEFT_, choices:ZaResource.accountStatusChoices});
	headerItems.push({type:_OUTPUT_, ref:ZaResource.A_name, label:ZaMsg.NAD_Email, labelLocation:_LEFT_, required:false});
	headerItems.push({type:_OUTPUT_,  ref:ZaItem.A_zimbraId, label:ZaMsg.NAD_ZimbraID});
	headerItems.push({type:_OUTPUT_, ref:ZaResource.A_zimbraCalResType, label:ZaMsg.NAD_ResType, labelLocation:_LEFT_, required:false,
						getDisplayValue: ZaResource.getResTypeLabel });	

	var tabChoices = new Array();
	var _tab1 = 1;
	var _tab2 = 2;				
	
	tabChoices.push({value:_tab1, label:ZaMsg.TABT_ResourceProperties});
	tabChoices.push({value:_tab2, label:ZaMsg.TABT_ResLocationContact});

	var cases = [];

	var nameGroup = {type:_TOP_GROUPER_, label:ZaMsg.NAD_ResourceNameGrouper, id:"resource_form_name_group",
			colSizes:["275px","*"],numCols:2,items:[		
			{ref:ZaResource.A_displayname, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ResourceName,
				label:ZaMsg.NAD_ResourceName, labelLocation:_LEFT_, width: "200px", onChange:ZaTabView.onFormFieldChanged },			
			{ref:ZaResource.A_name, type:_EMAILADDR_, msgName:ZaMsg.NAD_ResAccountName,label:ZaMsg.NAD_ResAccountName, 
				labelLocation:_LEFT_,onChange:ZaTabView.onFormFieldChanged
				/*elementChanged: function(elementValue,instanceValue, event) {
							//disable the autodisplayname whenever user does some action on the account name
							this.getInstance()[ZaResource.A2_autodisplayname] = "FALSE";
							form.itemChanged(this, elementValue, event);
							//this.setInstanceValue(value);						
						}*/
			}]
	};
	var setupGroup = {type:_TOP_GROUPER_, label:ZaMsg.NAD_ResourceSetupGrouper, id:"resource_form_setup_group",
		colSizes:["275px","*"],numCols:2,items:[			
		{ref:ZaResource.A_zimbraCalResType, type:_OSELECT1_, msgName:ZaMsg.NAD_ResType,
			label:ZaMsg.NAD_ResType, labelLocation:_LEFT_, onChange:ZaTabView.onFormFieldChanged,
			choices:ZaResource.resTypeChoices
	}]};
	if(ZaSettings.COSES_ENABLED) {
		setupGroup.items.push(
			/*{ref:ZaResource.A_COSId, type:_OSELECT1_, msgName:ZaMsg.NAD_ClassOfService,
				label:ZaMsg.NAD_ClassOfService, labelLocation:_LEFT_, 
				choices:this._app.getCosListChoices(), onChange:ZaResourceXFormView.onCOSChanged
			}*/
			{type:_GROUP_, numCols:3, nowrap:true, label:ZaMsg.NAD_ClassOfService, labelLocation:_LEFT_,
				items: [
					{ref:ZaResource.A_COSId, type:_DYNSELECT_,label: null, 
						onChange:ZaResourceXFormView.onCOSChanged,
						relevant:"instance[ZaResource.A2_autoCos]==\"FALSE\"",relevantBehavior:_DISABLE_ ,
						dataFetcherMethod:ZaSearch.prototype.dynSelectSearchCoses,choices:this.cosChoices,
						dataFetcherClass:ZaSearch,editable:true,getDisplayValue:function(newValue) {
								// dereference through the choices array, if provided
								//newValue = this.getChoiceLabel(newValue);
								if(ZaItem.ID_PATTERN.test(newValue)) {
									var cos = ZaCos.getCosById(newValue, this.getForm().parent._app);
									if(cos)
										newValue = cos.name;
								} 
								if (newValue == null) {
									newValue = "";
								} else {
									newValue = "" + newValue;
								}
								return newValue;
							}
					},
					{ref:ZaResource.A2_autoCos, type:_CHECKBOX_, 
						msgName:ZaMsg.NAD_Auto,label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_,
						trueValue:"TRUE", falseValue:"FALSE" ,
						elementChanged: function(elementValue,instanceValue, event) {
							this.getForm().parent.setDirty(true);
							if(elementValue=="TRUE") {
								ZaAccount.setDefaultCos(this.getInstance(), this.getForm().parent._app);	
							}
							this.getForm().itemChanged(this, elementValue, event);
						}
					}
				]
			}
		);
	}			
	setupGroup.items.push({ref:ZaResource.A_accountStatus, type:_OSELECT1_, editable:false, 
		msgName:ZaMsg.NAD_ResourceStatus,label:ZaMsg.NAD_ResourceStatus, 
		onChange:ZaTabView.onFormFieldChanged,
		labelLocation:_LEFT_, choices:ZaResource.accountStatusChoices});			

	setupGroup.items.push({ref:ZaResource.A2_schedulePolicy, type:_OSELECT1_, 
			msgName:ZaMsg.NAD_SchedulePolicy,label:ZaMsg.NAD_SchedulePolicy, 
			onChange:ZaTabView.onFormFieldChanged,
			elementChanged: function(elementValue,instanceValue, event) {
				if(elementValue==ZaResource.SCHEDULE_POLICY_MANUAL) {
					this.getInstance().attrs[ZaResource.A_zimbraCalResAutoDeclineRecurring]="FALSE";
				}
				this.getForm().itemChanged(this, elementValue, event);
			},
			labelLocation:_LEFT_, width: "300px", choices:ZaResource.schedulePolicyChoices});	
	
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResMaxNumConflictsAllowed, type:_TEXTFIELD_,
		msgName:ZaMsg.zimbraCalResMaxNumConflictsAllowed, label:ZaMsg.zimbraCalResMaxNumConflictsAllowed,
		labelLocation:_LEFT_, cssClass:"admin_xform_number_input", onChange:ZaTabView.onFormFieldChanged});		
		
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResMaxPercentConflictsAllowed, type:_TEXTFIELD_,
		msgName:ZaMsg.zimbraCalResMaxPercentConflictsAllowed, label:ZaMsg.zimbraCalResMaxPercentConflictsAllowed,
		labelLocation:_LEFT_, cssClass:"admin_xform_number_input", onChange:ZaTabView.onFormFieldChanged});		
	
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResAutoDeclineRecurring, type:_CHECKBOX_, 
		msgName:ZaMsg.NAD_DeclineRecurring,label:ZaMsg.NAD_DeclineRecurring,
		relevantBehavior:_DISABLE_, relevant:"(instance[ZaResource.A2_schedulePolicy]!=ZaResource.SCHEDULE_POLICY_MANUAL)",
		labelCssClass:"xform_label", align:_LEFT_, labelLocation:_LEFT_,
		trueValue:"TRUE", falseValue:"FALSE",onChange:ZaTabView.onFormFieldChanged});

	var passwordGroup = {type:_TOP_GROUPER_, label:ZaMsg.NAD_PasswordGrouper, id:"resource_form_password_group",
		colSizes:["275px","*"],numCols:2,items:[	
		{ref:ZaResource.A_password, type:_SECRET_, 
				msgName:ZaMsg.NAD_Password,label:ZaMsg.NAD_Password, labelLocation:_LEFT_,
				cssClass:"admin_xform_name_input", onChange:ZaTabView.onFormFieldChanged
		},
		{ref:ZaResource.A2_confirmPassword, type:_SECRET_, 
			msgName:ZaMsg.NAD_ConfirmPassword,label:ZaMsg.NAD_ConfirmPassword, labelLocation:_LEFT_, 
			cssClass:"admin_xform_name_input", onChange:ZaTabView.onFormFieldChanged
		}
	]};
	
	var notesGroup = {type:_TOP_GROUPER_, label:ZaMsg.NAD_NotesGrouper, id:"resource_form_notes_group",
		colSizes:["275px","*"],numCols:2,items:[
		{ref:ZaResource.A_description, type:_INPUT_, width: "300px", 
			msgName:ZaMsg.NAD_Description,label:ZaMsg.NAD_Description, 
			onChange:ZaTabView.onFormFieldChanged,
			labelLocation:_LEFT_, cssClass:"admin_xform_name_input"
		},
		{ref:ZaResource.A_notes, type:_TEXTAREA_, width: "300px", 
			msgName:ZaMsg.NAD_Notes,label:ZaMsg.NAD_Notes, 
			onChange:ZaTabView.onFormFieldChanged,
			labelLocation:_LEFT_
		}
	]};		
	
	var case1 = {type:_ZATABCASE_, numCols:1,  relevant:("instance[ZaModel.currentTab] == " + _tab1), height:"400px",  align:_LEFT_, valign:_TOP_,
		items:[nameGroup,setupGroup,passwordGroup,notesGroup]
	};

	cases.push(case1);
	
	var defaultWidth = 200 ;
	var case2={type:_ZATABCASE_, numCols:1, relevant:("instance[ZaModel.currentTab] == " + _tab2),
		items: [
			{type:_ZAGROUP_, items:[
				{ref:ZaResource.A_zimbraCalResContactName, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactName,label:ZaMsg.NAD_ContactName, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},	
				{ref:ZaResource.A_zimbraCalResContactEmail, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactEmail,label:ZaMsg.NAD_ContactEmail, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_zimbraCalResContactPhone, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactPhone,label:ZaMsg.NAD_ContactPhone, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_contactInfoAutoComplete, type: _AUTO_COMPLETE_LIST_, 
					matchValue:ZaContactList.matchValue, matchText: ZaContactList.matchText,
					dataLoaderClass: ZaContactList , dataLoaderMethod: ZaContactList.prototype.getContactList ,
					compCallback: ZaContactList.prototype._autocompleteCallback,
					inputFieldElementId: ZaResource.A_zimbraCalResContactName , onChange:ZaTabView.onFormFieldChanged  
				}
				
			]},	
			{type:_ZAGROUP_, items:[					
				{type:_GROUP_, numCols:3, nowrap:true, msgName:ZaMsg.NAD_LocationDisplayName, width:200, label:ZaMsg.NAD_LocationDisplayName, labelLocation:_LEFT_, 
					items: [
						{ref:ZaResource.A_locationDisplayName, type:_TEXTFIELD_, label:null, cssClass:"admin_xform_name_input", width:defaultWidth,  
							relevant:"instance[ZaResource.A2_autoLocationName] == \"FALSE\"",
							relevantBehavior:_DISABLE_, onChange:ZaTabView.onFormFieldChanged
						},
						{ref:ZaResource.A2_autoLocationName , type:_CHECKBOX_, msgName:ZaMsg.NAD_Auto,
							label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_, onChange:ZaTabView.onFormFieldChanged,
							trueValue:"TRUE", falseValue:"FALSE",
							elementChanged: ZaResource.setAutoLocationName								
						}
				]},
				{ref:ZaResource.A_zimbraCalResSite, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Site,label:ZaMsg.NAD_Site, 
					labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged,
					elementChanged: ZaResource.setAutoLocationName
				},					
				{ref:ZaResource.A_zimbraCalResBuilding, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Building,
					label:ZaMsg.NAD_Building, labelLocation:_LEFT_, onChange:ZaTabView.onFormFieldChanged,
					width:defaultWidth, elementChanged: ZaResource.setAutoLocationName
				},
				{ref:ZaResource.A_zimbraCalResFloor, type:_TEXTFIELD_, 
					msgName:ZaMsg.NAD_Floor,label:ZaMsg.NAD_Floor, 
					labelLocation:_LEFT_, width:defaultWidth, 
					onChange:ZaTabView.onFormFieldChanged,
					elementChanged: ZaResource.setAutoLocationName
				},
				{ref:ZaResource.A_zimbraCalResRoom, type:_TEXTFIELD_, 
					msgName:ZaMsg.NAD_Room,label:ZaMsg.NAD_Room, 
					labelLocation:_LEFT_, width:defaultWidth, 
					onChange:ZaTabView.onFormFieldChanged,
					elementChanged: ZaResource.setAutoLocationName
				},
				{ref:ZaResource.A_zimbraCalResCapacity, type:_TEXTFIELD_, 
					msgName:ZaMsg.NAD_Capacity,label:ZaMsg.NAD_Capacity, 
					onChange:ZaTabView.onFormFieldChanged,
					labelLocation:_LEFT_, width:defaultWidth,
					relevant: "instance.attrs[ZaResource.A_zimbraCalResType].toLowerCase() ==  ZaResource.RESOURCE_TYPE_LOCATION.toLowerCase( )",
					relevantBehavior:_HIDE_
				}
			]},			
			{type:_ZAGROUP_, items:[
				{ref:ZaResource.A_street, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Street,label:ZaMsg.NAD_Street, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_city, type:_TEXTFIELD_, msgName:ZaMsg.NAD_city ,label:ZaMsg.NAD_city, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_state, type:_TEXTFIELD_, msgName:ZaMsg.NAD_state ,label:ZaMsg.NAD_state, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_country, type:_TEXTFIELD_, msgName:ZaMsg.country ,label:ZaMsg.NAD_country, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged},
				{ref:ZaResource.A_zip, type:_TEXTFIELD_, msgName:ZaMsg.zip ,label:ZaMsg.NAD_zip, labelLocation:_LEFT_, width:defaultWidth, onChange:ZaTabView.onFormFieldChanged}
			]}						
		]
	};
	cases.push(case2);
		
	xFormObject.tableCssStyle="width:100%;";
	xFormObject.items = [
			{type:_GROUP_, cssClass:"ZmSelectedHeaderBg", colSpan: "*", id:"xform_header", 
				items: [
					{type:_GROUP_,	numCols:4,colSizes:["90px","350px","100px","200px"],items:headerItems}
				],
				cssStyle:"padding-top:5px; padding-bottom:5px"
			},
			{type:_TAB_BAR_,  ref:ZaModel.currentTab,choices:tabChoices,cssClass:"ZaTabBar", id:"xform_tabbar"},
			{type:_SWITCH_, align:_LEFT_, valign:_TOP_, items:cases}
	];
};
ZaTabView.XFormModifiers["ZaResourceXFormView"].push(ZaResourceXFormView.myXFormModifier);