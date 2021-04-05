import {
    Box,
    Button,
    Heading,
    HStack,
    Icon,
    Image,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text
} from '@chakra-ui/react';
import React, {useEffect, useState} from 'react';
import {BsFileCode} from 'react-icons/all';
import {
    getTLVCodeForDefinitions,
    translateJsonToM4Macros,
    translateParametersToJson,
} from '../translation/Translation';
import {GeneralSettingsForm} from '../components/GeneralSettingsForm';
import {useHistory} from 'react-router-dom';
import {GenericSettingsFormComponent} from "../components/GenericSettingsFormComponent";
import {ConfigurationParameters} from "../translation/ConfigurationParameters";
import {CoreDetailsComponent} from "./CoreDetailsComponent";

export default function HomePage({
                                     generalSettings,
                                     setGeneralSettings,
                                     settings,
                                     setSettings,
                                     setCoreJson,
                                     coreJson,
                                     getSVForTlv,
                                     tlvForJson,
                                     sVForJson,
                                     macrosForJson
                                 }) {
    const [formErrors, setFormErrors] = useState([]);
    const [userChangedStages, setUserChangedStages] = useState([])
    const [pipelineDefaultDepth, setPipelineDefaultDepth] = useState()
    const history = useHistory();

    function updateDefaultStagesForPipelineDepth(depth) {
        let valuesToSet;
        if (depth === 1) {
            valuesToSet = {
                next_pc_stage: 0,
                fetch_stage: 0,
                decode_stage: 0,
                branch_pred_stage: 0,
                register_rd_stage: 0,
                execute_stage: 0,
                result_stage: 0,
                register_wr_stage: 0,
                mem_wr_stage: 0,
                ld_return_align: 1,
                branch_pred: "fallthrough"
            }
        } else if (depth === 2) {
            valuesToSet = {
                next_pc_stage: 0,
                fetch_stage: 0,
                decode_stage: 0,
                branch_pred_stage: 0,
                register_rd_stage: 0,
                execute_stage: 1,
                result_stage: 1,
                register_wr_stage: 1,
                mem_wr_stage: 1,
                ld_return_align: 2,
                branch_pred: "two_bit"
            }
        } else if (depth === 4) {
            valuesToSet = {
                next_pc_stage: 0,
                fetch_stage: 0,
                decode_stage: 1,
                branch_pred_stage: 1,
                register_rd_stage: 1,
                execute_stage: 2,
                result_stage: 2,
                register_wr_stage: 3,
                mem_wr_stage: 3,
                extra_replay_bubble: 1,
                ld_return_align: 4,
                branch_pred: "two_bit"
            }
        } else if (depth === 6) {
            valuesToSet = {
                next_pc_stage: 1,
                fetch_stage: 1,
                decode_stage: 3,
                branch_pred_stage: 4,
                register_rd_stage: 4,
                execute_stage: 5,
                result_stage: 5,
                register_wr_stage: 6,
                mem_wr_stage: 7,
                extra_replay_bubble: 1,
                ld_return_align: 7,
                branch_pred: "two_bit"
            }
        }

        const newSettings = {...settings}
        if (Object.entries(valuesToSet).length === 0) return;
        Object.entries(valuesToSet).forEach(entry => {
            const [key, value] = entry
            if (!userChangedStages.includes(key)) {
                newSettings[key] = value
            }
        })
        setSettings(newSettings)
        setPipelineDefaultDepth(depth)
    }

    useEffect(() => {
        validateForm(false);
        if (generalSettings.depth && pipelineDefaultDepth !== generalSettings.depth) updateDefaultStagesForPipelineDepth(generalSettings.depth)
    }, [settings, generalSettings]);

    function validateForm(err) {
        if (!err) {
            translateParametersToJson(generalSettings, settings);
            const json = {general: generalSettings, pipeline: settings};
            setCoreJson(json);
            return;
        }

        if (!generalSettings.depth) {
            setFormErrors([...formErrors, 'depth']);
        } else {
            setFormErrors([]);
            translateParametersToJson(generalSettings, settings);
            const json = {general: generalSettings, pipeline: settings};
            setCoreJson(json);
            return json;
        }

        return null;
    }

    function handleOpenInMakerchipButtonClicked() {
        if (validateForm(true)) {
            const macros = translateJsonToM4Macros(coreJson);
            const tlv = getTLVCodeForDefinitions(macros);
            const formBody = new URLSearchParams();
            formBody.append("source", tlv);
            fetch(
                "https://makerchip.com/project/public",
                {
                    method: 'POST',
                    body: formBody,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            ).then(resp => resp.json())
                .then(json => {
                    const url = json.url
                    window.open(`https://makerchip.com${url}`)
                })
        }
    }

    function handleGoToCoreDetailsButtonClicked() {
        const json = validateForm(true);
        setCoreJson(json);
        if (!json) return;
        history.push('/core');
    }

    function handleDownloadRTLVerilogButtonClicked() {
        if (validateForm(true)) {
            const macros = translateJsonToM4Macros(coreJson);
            const tlv = getTLVCodeForDefinitions(macros);
            getSVForTlv(tlv, sv => {
                download('verilog.sv', sv);
            });

        }
    }

    return <>
        <Box textAlign='center' mb={25}>
            <Image src='warpv-logo.png' w={250} mx='auto'/>
            <Text>The open-source RISC-V core IP you can shape to your needs!</Text>
        </Box>

        <Heading textAlign='center' size='md' mb={5}>What CPU core can we build for you today?</Heading>

        <Box mx='auto' mb={10}>
            <HStack columns={2}>
                <CorePreview path='warpv-core-small.png' info='Low-Power, Low-Freq 1-cyc FPGA Implementation'/>
                <CorePreview path='warpv-core-big.png' info='High-Freq 6-cyc ASIC Implementation' w={300}/>
            </HStack>
        </Box>

        <Box mx='auto' maxW='85vh'>
            <Heading size='md' mb={4}>Configure your CPU now</Heading>
            <Tabs borderWidth={1} borderRadius='lg' p={3}>
                <TabList>
                    <Tab>General</Tab>
                    <Tab>Multi-Core</Tab>
                    <Tab>Pipeline</Tab>
                    <Tab>Components</Tab>
                    <Tab>Hazards</Tab>
                    <Tab>Memory</Tab>
                    <Tab>I/O</Tab>
                    {/*<Tab>Program</Tab>*/}
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <GeneralSettingsForm setGeneralSettings={setGeneralSettings}
                                             generalSettings={generalSettings}
                                             formErrors={formErrors}/>
                    </TabPanel>
                    <TabPanel>
                        <GenericSettingsFormComponent setSettings={setSettings}
                                                      settings={settings}
                                                      configurationParametersSubset={(settings["cores"] && settings["cores"] > 1) ? ["cores", "vcs", "prios", "max_packet_size"] : ["cores"]}/>
                    </TabPanel>
                    <TabPanel>
                        <GenericSettingsFormComponent setSettings={setSettings}
                                                      settings={settings}
                                                      configurationParametersSubset={["ld_return_align"].concat(ConfigurationParameters.map(param => param.jsonKey).filter(jsonKey => jsonKey !== "branch_pred" && jsonKey.endsWith("_stage")))}
                                                      userChangedStages={userChangedStages}
                                                      setUserChangedStages={setUserChangedStages}/>
                    </TabPanel>
                    <TabPanel>
                        <GenericSettingsFormComponent setSettings={setSettings}
                                                      settings={settings}
                                                      configurationParametersSubset={["branch_pred"]}/>
                    </TabPanel>
                    <TabPanel>
                        <GenericSettingsFormComponent setSettings={setSettings}
                                                      settings={settings}
                                                      configurationParametersSubset={ConfigurationParameters.filter(param => param.jsonKey.startsWith("extra_")).map(param => param.jsonKey)}/>
                    </TabPanel>
                    <TabPanel>
                        <Text>WARP-V currently supports only the CPU core itself, with a small instruction memory and
                            data memory.</Text>
                    </TabPanel>
                    <TabPanel>
                        <Text>WARP-V does not currently provide any I/O components.</Text>
                    </TabPanel>
                    <TabPanel>
                        <Text>Coming soon!</Text>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>

        <Box mt={5} mb={15} mx='auto' maxW='85vh' pb={10} borderBottomWidth={2}>
            <Heading size='lg' mb={15}>Get your code:</Heading>

            <HStack mb={3}>
                <Box>
                    <Button type='button' colorScheme="teal" onClick={handleDownloadRTLVerilogButtonClicked}>Download
                        Verilog</Button>
                </Box>
                <Button type='button' colorScheme='blue' onClick={handleOpenInMakerchipButtonClicked}>Open in Makerchip
                    IDE</Button>
            </HStack>

            <Image src='makerchip-preview.png' w='350px'/>


        </Box>

        <CoreDetailsComponent generalSettings={generalSettings} settings={settings}
                              coreJson={coreJson} tlvForJson={tlvForJson} macrosForJson={macrosForJson}
                              sVForJson={sVForJson}/>
    </>;
}

function CorePreview({path, info, ...rest}) {
    return <Box mx='auto'>
        <Image src={path} mx='auto' {...rest} />
        <Text mx='auto' textAlign='center' maxW={160}>{info}</Text>
    </Box>;
}


function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
