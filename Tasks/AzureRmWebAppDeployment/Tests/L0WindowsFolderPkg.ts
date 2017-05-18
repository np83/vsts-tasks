import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'azurermwebappdeployment.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('ConnectedServiceName', 'AzureRMSpn');
tr.setInput('WebAppName', 'mytestapp');
tr.setInput('Package', 'webAppPkg');
tr.setInput('UseWebDeploy', 'true');

process.env['TASK_TEST_TRACE'] = 1;
process.env["ENDPOINT_AUTH_AzureRMSpn"] = "{\"parameters\":{\"serviceprincipalid\":\"spId\",\"serviceprincipalkey\":\"spKey\",\"tenantid\":\"tenant\"},\"scheme\":\"ServicePrincipal\"}";
process.env["ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONNAME"] = "sName";
process.env["ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONID"] =  "sId";
process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["SYSTEM_DEFAULTWORKINGDIRECTORY"] =  "DefaultWorkingDirectory";
process.env["BUILD_SOURCEVERSION"] = "46da24f35850f455185b9188b4742359b537076f";
process.env["BUILD_BUILDID"] = 1,
process.env["RELEASE_RELEASEID"] = 1;
process.env["BUILD_BUILDNUMBER"] = 1;
process.env["RELEASE_RELEASENAME"] = "Release-1";
process.env["BUILD_REPOSITORY_PROVIDER"] = "TfsGit";
process.env["BUILD_REPOSITORY_NAME"] = "MyFirstProject";
process.env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"] = "https://abc.visualstudio.com/";
process.env["SYSTEM_TEAMPROJECT"] = "MyFirstProject";
process.env["BUILD_SOURCEVERISONAUTHOR"] = "author";
process.env["RELEASE_RELEASEURI"] = "vstfs:///ReleaseManagement/Release/1";
process.env["AGENT_NAME"] = "author";

// provide answers for task mock
let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "which": {
        "msdeploy": "msdeploy"
    },
    "stats": {
    	"webAppPkg.zip": {
    		"isFile": true
    	}
    },
    "osType": {
        "osType": "Windows"
    },
    "checkPath": {
        "msdeploy": true,
        "webAppPkg.zip": true,
        "webAppPkg": true
    },
    "exec": {
        "msdeploy -verb:getParameters -source:package=\'webAppPkg.zip\'": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "msdeploy -verb:sync -source:IisApp=\"'webAppPkg'\" -dest:iisApp=\"'mytestapp'\",ComputerName=\"'https://mytestappKuduUrl/msdeploy.axd?site=mytestapp'\",UserName=\"'$mytestapp'\",Password=\"'mytestappPwd'\",AuthType=\"'Basic'\" -enableRule:DoNotDeleteRule -userAgent:TFS_useragent":{
            "code": 0,
            "stdout": "Executed Successfully"
        }
    },
    "exist": {
    	"webAppPkg.zip": true,
        "webAppPkg": true
    }, 
    "glob": {
        "webAppPkgPattern" : ["webAppPkg1", "webAppPkg2"],
        "Invalid_webAppPkg" : [],
        "webAppPkg.zip": ["webAppPkg.zip"],
        "webAppPkg": ["webAppPkg"]
    },
    "getVariable": {
    	"ENDPOINT_AUTH_AzureRMSpn": "{\"parameters\":{\"serviceprincipalid\":\"spId\",\"serviceprincipalkey\":\"spKey\",\"tenantid\":\"tenant\"},\"scheme\":\"ServicePrincipal\"}",
   		"ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONNAME": "sName", 
    	"ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONID": "sId",
    	"AZURE_HTTP_USER_AGENT": "TFS_useragent",
        "System.DefaultWorkingDirectory": "DefaultWorkingDirectory",
		"build.sourceVersion": "46da24f35850f455185b9188b4742359b537076f",
		"build.buildId": 1,
		"release.releaseId": 1,
		"build.buildNumber": 1,
		"release.releaseName": "Release-1",
		"build.repository.provider": "TfsGit",
		"build.repository.name": "MyFirstProject",
		"system.TeamFoundationCollectionUri": "https://abc.visualstudio.com/",
		"system.teamProject": "MyFirstProject",
		"build.sourceVersionAuthor": "author",
		"release.releaseUri": "vstfs:///ReleaseManagement/Release/1",
		"agent.name": "agent"
    }
}

var kuduDeploymentLog = require('azurerest-common/kududeploymentstatusutility.js');
var msDeployUtility = require('webdeployment-common/msdeployutility.js'); 
tr.registerMock('./msdeployutility.js', {
    getMSDeployCmdArgs : msDeployUtility.getMSDeployCmdArgs,
    getMSDeployFullPath : function() {
        var msDeployFullPath =  "msdeploypath\\msdeploy.exe";
        return msDeployFullPath;
    }
}); 

tr.registerMock('azurerest-common/azurerestutility.js', {
    getAzureRMWebAppPublishProfile: function(SPN, webAppName, resourceGroupName, deployToSlotFlag, slotName) {
        var mockPublishProfile = {
            profileName: 'mytestapp - Web Deploy',
            publishMethod: 'MSDeploy',
            publishUrl: 'mytestappKuduUrl',
            msdeploySite: 'mytestapp',
            userName: '$mytestapp',
            userPWD: 'mytestappPwd',
            destinationAppUrl: 'mytestappUrl',
            SQLServerDBConnectionString: '',
            mySQLDBConnectionString: '',
            hostingProviderForumLink: '',
            controlPanelLink: '',
            webSystem: 'WebSites' 
        };
        if(deployToSlotFlag) {
            mockPublishProfile.profileName =  'mytestapp-' + slotName + ' - Web Deploy';
            mockPublishProfile.publishUrl = 'mytestappKuduUrl-' + slotName;
            mockPublishProfile.msdeploySite = 'mytestapp__' + slotName;
            mockPublishProfile.userName = '$mytestapp__' + slotName;
            mockPublishProfile.userPWD = 'mytestappPwd';
            mockPublishProfile.destinationAppUrl = 'mytestappUrl-' + slotName;
        }
        return mockPublishProfile;
    },
    getAzureRMWebAppConfigDetails: function(SPN, webAppName, resourceGroupName, deployToSlotFlag, slotName) {
	var config = { 
			id: 'appid',
			properties: { 
				virtualApplications: [ ['Object'], ['Object'], ['Object'] ],
                scmType: "None"
			} 
		}

		return config;
	},
    updateDeploymentStatus: function(publishingProfile, isDeploymentSuccess ) {
        if(isDeploymentSuccess) {
            console.log('Updated history to kudu');
        }
        else {
            console.log('Failed to update history to kudu');
        }
        var webAppPublishKuduUrl = publishingProfile.publishUrl;
        var requestDetails = kuduDeploymentLog.getUpdateHistoryRequest(webAppPublishKuduUrl, isDeploymentSuccess);
        requestDetails["requestBody"].author = 'author';
        console.log("kudu log requestBody is:" + JSON.stringify(requestDetails["requestBody"]));
    },
    getResourceGroupName: function (SPN, webAppName) {
        return "foobar";
    },
    getWebAppAppSettings : function (SPN, webAppName: string, resourceGroupName: string, deployToSlotFlag: boolean, slotName: string){
        var appSettings = {
            properties : {
                MSDEPLOY_RENAME_LOCKED_FILES : '1'
            }
        };
        return appSettings;
    },
    updateWebAppAppSettings : function (){
        return true;
    },
    updateAzureRMWebAppConfigDetails: function() {
        console.log("Successfully updated scmType to VSTSRM");
    }
});

var fs = require('fs');
tr.registerMock('fs', {
    createWriteStream: function (filePath, options) {
        return { 
            "isWriteStreamObj": true,
            "on": (event) => {
                console.log("event: " + event + " has been triggered");
            },
            "end" : () => { return true; }
        };
    },
    ReadStream: fs.ReadStream,
    WriteStream: fs.WriteStream,
    openSync: function (fd, options) {
        return true;
    },
    closeSync: function (fd) {
        return true;
    },
    fsyncSync: function(fd) {
        return true;
    },
    fstat: fs.fstat,
    read: fs.read,
    open: fs.open,
    writeFile: fs.writeFile,
    symlink: fs.symlink,
    stat: fs.stat
});

tr.setAnswers(a);
tr.run();