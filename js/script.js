/*************************************************************************************************
Application	: MetaXplore
Author		: Santosh Pradhan
Date  		: 14th July, 2014
Contact 	: ping.skp@gmail.com
Description	: Display MetaData from Salesforce for:
				- Apex Class
				- Apex Triggers
				- VF Pages
				- VF Components
			  Schema Explored for Standard/Custom Objects
			  Record Analysis for Objects
************************************************************************************************/
var j$ = jQuery.noConflict();

//Variables to store string values
var metadataType = 'metadata';
var codeType = 'code';
var retClass = 'Apexclass';
var retPage = 'Apexpage';
var retComp = 'Apexcomponent';
var retTriger = 'Apextrigger';

//Variables to store SessionID and OrgID from Salesforce
var sessionCookie;
var orgID;

//Maps and Arrays that store Meta information
var lstClass = {};
var lstPage = {};
var lstComponent = {};
var lstTrigger = {};
var ComponentList = [];

//Buffer Variables
var bufferCodeLines = '';
var bufferCodeText = '';

j$(document).ready(function(){
	insertMetaXplore();		//Inject code to Salesforce
	//getDataLoaded();		//Fetch data from local storage
	sessionCookie = getCookie('sid');
	OrgID = getCookie('oid');
	
	j$('.menuoptionMX').click(function(){
		j$('.menuoptionMX').removeClass('selected');
		j$(this).addClass('selected');
		var componentType = j$(this).attr('componentType');
		var type = j$(this).attr('type');
		
		if(type == metadataType){
			retMetadata(componentType);
		}else{
			retData(componentType);
		}
	});
	
	//Describe call execution
	j$(document).delegate('.describeResult', 'click', function() {
		calcDataUsage(j$(this).attr('url'), j$(this).attr('object'));
	});
	
	//Test Coverage Query
	j$(document).delegate('.testCodeCoverageBtn', 'click', function() {
		calcTestCoverage(j$(this).attr('classID'));
	});
	
	//Open MetaXplore Screen
	j$('.metaXploreApp').click(function(){
		j$('.contentwrapper').fadeIn(500);
		j$('.overlayMX').fadeIn(400);
	});
	
	//Close MetaXplore Screen
	j$('.closeBtnMX').click(function(){
		j$('.contentwrapper').fadeOut(400);
		j$('.overlayMX').fadeOut(500);
	});
});

//Method to retrieve data from Local Storage
function getDataLoaded(){
	//Retrieve Apex Classes
	chrome.storage.local.get(retClass, function(obj){
		lstClass = obj[retClass];
	});
	//Retrieve Pages
	chrome.storage.local.get(retPage, function(obj){
		lstPage = obj[retPage];
	});
	//Retrieve VF Components
	chrome.storage.local.get(retComp, function(obj){
		lstComponent = obj[retComp];
	});
	//Retrieve Apex Triggers
	chrome.storage.local.get(retTriger, function(obj){
		lstTrigger = obj[retTriger];
	});
}

//Function to inject HTML into Salesforce
function insertMetaXplore() {
	var insertSearchApp = '<a href="#" class="menuButtonMenuLink metaXploreApp">MetaXplore</a>';	//The App menu HTML
	
	//The UI that appears on click of App Menu
	var insertMetaXploreDiv = '<div class="overlayMX"/>' +
		'<div class="contentwrapper" style="display: none;">' +
			'<div class="menupanelMX">' +
				'<div id="navMX">' +
					'<span style="margin-left: 12px;">MetaXplore</span>' +
				'</div>' +
				'<span class="parentOptionMX">Apex Search</span>' +
				'<span class="childOptionMX">' +
					'<span class="menuoptionMX" componentType="Apexclass" type="code">Apex Class</span>' +
					'<span class="menuoptionMX" componentType="Apextrigger" type="code">Apex Trigger</span>' +
					'<span class="menuoptionMX" componentType="Apexpage" type="code">VF Pages</span>' +
					'<span class="menuoptionMX" componentType="Apexcomponent" type="code">VF Components</span>' +
				'</span>' +
				'<span class="parentOptionMX">Schema Search</span>' +
				'<span class="childOptionMX">' +
					'<span class="menuoptionMX" componentType="sobjects" type="metadata">Objects</span>' +
				'</span>' +
			'</div>' +
		
			'<div class="contentpanel">' +
				'<div id="nav2">' +
					'<span style="margin-left: 12px;">MetaXplore</span>' +
					'<span class="closeBtnMX"/>' +
				'</div>' +
				'<div class="loadingMsg" style="text-align: center;display:none;">Loading...</div>' + 
				'<div id="settings"></div>' + 
				'<div id="container">' +
					'<div id="dt_example">' +
						'<div id="dynamic"></div>' +
						'<div class="spacer"></div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';
	
	//Inject code into Salesforce
	j$('.bPageHeader').before(insertMetaXploreDiv);
	j$(".menuSeparator").before(insertSearchApp);
	
	//Inject Code Coverage button
	var coverageViewPanel = j$('#ApexClassViewPage\\:theTemplate\\:theForm\\:thePageBlock\\:thePageBlockButtons'); 	//Class View Page
	var coverageEditPanel = j$('#ApexClassEditPage\\:theTemplate\\:theForm\\:thePageBlock\\:thePageBlockButtons'); 	//Class View Page
	if(coverageViewPanel != undefined && coverageViewPanel.length > 0){
		var classID = j$('#ApexClassViewPage\\:theTemplate\\:theForm').attr('action').split('?')[1].substring(3);
		classID = classID.replace('/','');
		var codeCoverageBtn = '<input type="button" class="btn btn testCodeCoverageBtn" value="Code Coverage" classID="' + classID + '"/>';
		j$(coverageViewPanel).append(codeCoverageBtn);
	}
}

//Method to fetch SessionID/OrgID from Cookies
function getCookie(c_name){
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++){
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_name){
			return unescape(y);
		}
	}
}

//Method checks if data is already present and makes a call [Lazy Loading]
function retData(componentType){
	if(componentType == retClass && (lstClass != undefined && lstClass.length > 0)){
		populateData(lstClass);
		return;
	}
	if(componentType == retComp && (lstComponent != undefined && lstComponent.length > 0)){
		populateData(lstComponent);
		return;
	}
	if(componentType == retPage && (lstPage != undefined && lstPage.length > 0)){
		populateData(lstPage);
		return;
	}
	if(componentType == retTriger && (lstTrigger != undefined && lstTrigger.length > 0)){
		populateData(lstTrigger);
		return;
	}
	ComponentList=[];
	queryComponents(componentType, 0);
}

//Show 'loading...' message
function showLoading(){
	j$('.loadingMsg').show();
}

//Hide 'loading...' message
function hideLoading(){
	j$('.loadingMsg').hide();
}

//Method makes call to fetch Components [May cause iterative calls based on number of Components present, as batch size is 200]
function queryComponents(componentType, offsetVal){
	var currentDomain = window.location.host;
	
	if(componentType == retClass && (lstClass == undefined || lstClass.length == 0)){
		ComponentList=[];
	}
	if(componentType == retComp && (lstComponent == undefined || lstComponent.length == 0)){
		ComponentList=[];
	}
	if(componentType == retPage && (lstPage == undefined || lstPage.length == 0)){
		ComponentList=[];
	}
	if(componentType == retTriger && (lstTrigger == undefined || lstTrigger.length == 0)){
		ComponentList=[];
	}
	var queryURL;
	var instanceURL = "https://"+currentDomain+'/';
	if( componentType == 'Apexclass' || componentType == 'Apextrigger' ){
		queryURL = "services/data/v28.0/query/?q=SELECT+id,name,CreatedBy.Name,LastModifiedDate,Body+from+"+componentType+"+Where+NamespacePrefix=''+offset+"+offsetVal;
	}else{
		queryURL = "services/data/v28.0/query/?q=SELECT+id,name,CreatedBy.Name,LastModifiedDate,Markup+from+"+componentType+"+Where+NamespacePrefix=''+or+NamespacePrefix!=''+offset+"+offsetVal;
	}
	showLoading();
	jQuery.ajax({
		url : instanceURL+queryURL,
		headers : {"Authorization": "Bearer "+ sessionCookie},
		contentType : "application/json"
	}).done(function(response){
		for(var i in response.records){
			var result = [];
			result.push('<a class="componentURL" target="_blank" href="'+instanceURL+response.records[i].Id+'">'+response.records[i].Name+'</a>');
			if(response.records[i] == null || response.records[i].CreatedBy == null){
				result.push('');
			}else{
				result.push(response.records[i].CreatedBy.Name);
			}
			if(response.records[i].LastModifiedDate == null || response.records[i].LastModifiedDate == undefined){
				result.push('');
			}else{
				result.push(response.records[i].LastModifiedDate.split('T')[0]);
			}
			
			if(response.records[i].Body != undefined){
				result.push(response.records[i].Body);
			}else{
				result.push(response.records[i].Markup);
			}ComponentList.push(result);
		}
		
		if(response.records.length == 200){
			queryComponents(componentType, offsetVal+200);
		}
		
		//storeData(componentType, ComponentList);
		populateData(ComponentList);
		hideLoading();
	}).fail(function(error){
		alert('Component not supported or Session expired');
		hideLoading();
	});
	return ComponentList;
}

//Method to store data in Local Storage [Currently disabled]
function storeData(key, resultData){
    var jsonfile = {};
    jsonfile[key] = resultData;
    chrome.storage.local.set(jsonfile, function () {});
}

//Calculates field usage for Objects and Records
function calcDataUsage(componentURL, objectName){
	var currentDomain = window.location.host;
	var finalList=[];
	var queryURL = componentURL;
	var objQueryURL = "/services/data/v28.0/query/?q=SELECT+";
	var fieldList = "";
	var appendFilter = "+from+"+objectName;
	var mapFieldTo = {};
	var mapNameToLabel = {};
	var fieldArray = [];
	var totalRecords;
	
	jQuery.ajax({
		url : queryURL,
		headers : {"Authorization": "Bearer "+ sessionCookie},
		contentType : "application/json"
	}).done(function(response){
		for(var i in response.fields){
			mapFieldTo[response.fields[i].label] = 0;
			mapNameToLabel[response.fields[i].name] = response.fields[i].label;
			fieldList += response.fields[i].name + ',';
			fieldArray.push(response.fields[i].name);
		}
		
		fieldList = fieldList.substring(0, fieldList.length - 1);
		var queryStr = objQueryURL+fieldList+appendFilter;
		jQuery.ajax({
			url : queryStr,
			headers : {"Authorization": "Bearer "+ sessionCookie},
			contentType : "application/json"
		}).done(function(response){
			totalRecords = response.records.length;
			for(var i in response.records){
				var dataRow = response.records[i];
				for(var j = 0; j < fieldArray.length; j++){
					if(dataRow[fieldArray[j]] != null){
						mapFieldTo[mapNameToLabel[fieldArray[j]]] = parseInt(mapFieldTo[mapNameToLabel[fieldArray[j]]]) + 1;
					}else{
					}
				}
			}
			
			for(var i = 0; i < fieldArray.length; i++){
				if(mapFieldTo[mapNameToLabel[fieldArray[i]]] != null && totalRecords != 0){
					var result = [];
					var percentUsage = Math.round(parseInt(mapFieldTo[mapNameToLabel[fieldArray[i]]]) / parseInt(totalRecords) * 100);
					var percentNotUsed = 100 - percentUsage;
					var backgroundPos = -1 * percentNotUsed;
					var style = "background-position-x: "+backgroundPos+"px";
					style = percentUsage == 0 ? "background-position-x: -120px" : style;
					var styleClass = percentUsage < 30 ? "progressBar redBg" : "progressBar";
					result.push(fieldArray[i]);
					result.push('<span class="'+styleClass+'" percentwidth="'+percentNotUsed+'" style="'+style+'"></span><span style="display:inline-block; margin-left: 5px;">'+percentUsage+' %</span>');
					finalList.push(result);
				}
			}
			populateObjectData(finalList);
		}).fail(function(error){
			alert('Error!! Unable to fetch data from your salesforce instance' + JSON.stringify(error));
		});
		
		populateObjectData(finalList);
	}).fail(function(error){
		alert('Error!! Unable to fetch data from your salesforce instance' + JSON.stringify(error));
	});
	return finalList;
}

//Retrieves ApexClass/Trigger, VFPage/Component
function retMetadata(componentType){
	var currentDomain = window.location.host;
	var finalList=[];
	var queryURL = componentType;
	var instanceURL = '/services/data/v29.0/';
	jQuery.ajax({
		url : instanceURL+queryURL,
		headers : {"Authorization": "Bearer "+ sessionCookie},
		contentType : "application/json"
	}).done(function(response){
		var responseData = response.sobjects;
		for(var i in responseData){
			var result = [];
			result.push(responseData[i].label);
			if(responseData[i].custom){
				result.push('Custom');
			}else{
				result.push('Standard');
			}
			result.push('<div class="describeResult" url="'+instanceURL+'sobjects/'+responseData[i].name+'/describe" object="'+responseData[i].name+'">Describe</div>');
			finalList.push(result);
		}
		populateMetaData(finalList);
		
	}).fail(function(error){
		alert('Error!! Unable to fetch data from your salesforce instance' + JSON.stringify(error));
	});
	return finalList;
}

//Method to display test coverage of classes
function calcTestCoverage(classID){
	var queryURL = "/services/data/v29.0/tooling/query/?q=Select+id,Coverage+from+ApexCodeCoverage+Where+ApexClassorTriggerId='"+classID+"'";
	var codeLines = j$(j$(j$(j$('pre.codeBlock').children()[0]).children()[1]).children()[0]).children()[0];
	var codeLinesData = j$(j$(j$(j$('pre.codeBlock').children()[0]).children()[1]).children()[0]).children()[1];
	if(bufferCodeLines != undefined && bufferCodeLines.length > 0){
		j$(codeLines).html(bufferCodeLines);
	}
	if(bufferCodeText != undefined && bufferCodeText.length > 0){
		j$(codeLinesData).html(bufferCodeText);
	}
	jQuery.ajax({
		url : queryURL,
		headers : {"Authorization": "Bearer "+ sessionCookie},
		contentType : "application/json"
	}).done(function(response){
		var coverageLines = response.records;
		if(coverageLines.length == 0){
			alert('No Test Class executed for this class');
		}else{
			var covered = coverageLines[0].Coverage.coveredLines;
			var uncovered = coverageLines[0].Coverage.uncoveredLines;
			var coveragePercent = uncovered.length == 0 ? 100 : covered.length * 100 / (covered.length + uncovered.length);
			coveragePercent = (''+coveragePercent).split('.')[0];
			var codeText = j$(codeLines).html();
			var codeTextData = j$(codeLinesData).html();
			bufferCodeLines = j$(codeLines).html();
			bufferCodeText = j$(codeLinesData).html();
			var codeLineArray = codeText.split('<br>');
			var codeLineDataArray = codeTextData.split('<br>');
			
			for(var i = 0; i < codeLineArray.length; i++){
				if(uncovered.indexOf(parseInt(codeLineArray[i])) >= 0){
					codeLineArray[i] = '<span style="background-color:#E38695;">'+codeLineArray[i]+'</span>';
					codeLineDataArray[i] = '<span style="background-color:#E38695;">'+codeLineDataArray[i]+'</span>';
				}else{
					codeLineArray[i] = '<span style="background-color:#8DC5D5;">'+codeLineArray[i]+'</span>';
					codeLineDataArray[i] = '<span style="background-color:#8DC5D5;">'+codeLineDataArray[i]+'</span>';
				}
			}
			j$(codeLines).html(codeLineArray.join('<br>'));
			codeLineDataArray.pop();
			j$(codeLinesData).html(codeLineDataArray.join('<br>'));
			var totalLength = uncovered.length + covered.length;
			(j$('span[id*="codeCoverage"').parent()).html( '<span id="codeCoverage">'+coveragePercent + '% ('+covered.length+'/'+totalLength+')</span>');
		}
	}).fail(function(error){
		alert('Not supported.');
	});
}

//Method populates metadata
function populateMetaData(aDataSet){
	j$('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
	j$('#example').dataTable( {
		"aaData": aDataSet,
		"oLanguage": {
			"sSearch": "",
			"sLengthMenu": "",
			"sInfoEmpty": "No components found",
			"sZeroRecords": "No components found"
		},
		"aoColumns": [
			{ "sTitle": "Name" },
			{ "sTitle": "Type" },
			{ "sTitle": "", "sClass": "describeData" }
		]
	} );
	
	j$("input[aria-controls='example']").each(function(){
		j$(this).attr("placeholder", "Search...");
	});				
}

//Methods displays schema
function populateObjectData(aDataSet){
	j$('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
	j$('#example').dataTable( {
		"aaData": aDataSet,
		"oLanguage": {
			"sSearch": "",
			"sLengthMenu": "",
			"sInfoEmpty": "No components found",
			"sZeroRecords": "No components found"
		},
		"aoColumns": [
			{ "sTitle": "Name" },
			{ "sTitle": "Usage(%)" }
		]
	} );
	
	j$("input[aria-controls='example']").each(function(){
		j$(this).attr("placeholder", "Search...");
	});
}

//Method displays record analysis
function populateData(aDataSet){
	j$('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
	j$('#example').dataTable( {
		"aaData": aDataSet,
		"oLanguage": {
			"sSearch": "",
			"sLengthMenu": "",
			"sInfoEmpty": "No components found",
			"sZeroRecords": "No components found"
		},
		"aoColumns": [
			{ "sTitle": "Name" },
			{ "sTitle": "Created By" },
			{ "sTitle": "Last Modified" },
			{ "bVisible": false }
		]
	} );
	
	j$("input[aria-controls='example']").each(function(){
		j$(this).attr("placeholder", "Search...");
	});				
}