import React, { useState } from "react";

export const Context = React.createContext(null);


export const MyProvider = (props: any) => {

	const [subjects, setAllSubjects] = useState([""])
	const [subject, setNewSubject] = useState({
		name: "",
		geometry: null
	})
	const [records, setAllRecords] = useState({
		HG: [],
		EP: []
	})
	const [record, setNewRecord] = useState({
		name: "",
		type: ""
	})
	const [sourceData, setSourceData] = useState([])
	const [filterData, setFilterData] = useState([])
	const [online, setOnline] = useState(false)
	const [bciState, setBciState] = useState("Not Connected")
	const [brain, setNewBrain] = useState("")
	const [brainCoord, setNewBrainCoord] = useState("")
	const [task, setTask] = useState("");
	const [EPData, setEPData] = useState();
	const [mapData, setMapData] = useState('');
	const [zScores, setZScores] = useState('');
	const [bci, setBCI] = useState();
	const [cortstimNotes, setCortstimNotes] = useState({})
	const [taskTimes, setTaskTimes] = useState({})
	const [modality, setModality] = useState('Review')

	return (
		<Context.Provider value={{
			subjects,
			setAllSubjects,
			records,
			setAllRecords,
			record,
			setNewRecord,
			subject,
			setNewSubject,
			sourceData,
			filterData,
			setSourceData,
			setFilterData,
			online,
			setOnline,
			bciState,
			setBciState,
			brain,
			setNewBrain,
			task,
			setTask,
			brainCoord,
			setNewBrainCoord,
			EPData, setEPData,
			mapData, setMapData,
			zScores, setZScores,
			bci, setBCI,
			cortstimNotes, setCortstimNotes,
			taskTimes, setTaskTimes,
			modality, setModality
		}}>
			{props.children}
		</Context.Provider >
	);
}
