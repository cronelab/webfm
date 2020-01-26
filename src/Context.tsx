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
	const [brainType, setBrainType] = useState("2D")

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
			brainType,
			setBrainType,
			brainCoord,
			setNewBrainCoord,
		}}>
			{props.children}
		</Context.Provider >
	);
}
