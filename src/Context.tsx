import React, { useState } from "react";

export const Context = React.createContext([]);

export const MyProvider = (props: any) => {
	const [subjects, setAllSubjects] = useState([])
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
	const [brainContainer, setBrainSize] = useState({
		width: null,
		height: null
	})
	let value = {
		subjects, setAllSubjects,
		subject, setNewSubject,
		records, setAllRecords,
		record, setNewRecord,
		sourceData, setSourceData,
		filterData, setFilterData,
		online, setOnline,
		bciState, setBciState,
		brain, setNewBrain,
		brainContainer, setBrainSize
	}
	return (

		<Context.Provider value={[value]}>
			{props.children}
		</Context.Provider >
	);
}
