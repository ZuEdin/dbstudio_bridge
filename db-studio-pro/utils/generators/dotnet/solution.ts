
import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateSolution = (config: BackendConfig): VirtualFile => {
  const projectGuid = crypto.randomUUID().toUpperCase();
  const clientGuid = crypto.randomUUID().toUpperCase();
  const solutionGuid = crypto.randomUUID().toUpperCase();
  
  const projectName = config.projectName;
  const isBlazor = config.frontendFramework === 'blazor';
  const isMaui = config.frontendFramework === 'maui';
  const isMauiNative = config.frontendFramework === 'maui-native';
  const serverName = (isBlazor || isMaui || isMauiNative) ? `${projectName}.Server` : projectName;
  
  let clientName = `${projectName}.Client`;
  if (isMaui) {
    clientName = `${projectName}.Maui`;
  } else if (isMauiNative) {
    clientName = `${projectName}.MauiNative`;
  }

  const content = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${serverName}", "${serverName}\\${serverName}.csproj", "{${projectGuid}}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${clientName}", "${clientName}\\${clientName}.csproj", "{${clientGuid}}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{${projectGuid}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{${projectGuid}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{${projectGuid}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{${projectGuid}}.Release|Any CPU.Build.0 = Release|Any CPU
		{${clientGuid}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{${clientGuid}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{${clientGuid}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{${clientGuid}}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {${solutionGuid}}
	EndGlobalSection
EndGlobal
`;

  return {
    name: `${projectName}.sln`,
    path: `${projectName}.sln`,
    content: content.trim(),
    language: 'text'
  };
};
