import { Context } from "./Context";
import React, { Component } from "react";
export class MyProvider extends Component {
  state = {
    subjects: [],
    subject: { name: "", geometry: null },
    records: { HG: [], EP: [] },
    record: { name: "", type: "" },
    sourceData: [],
    filterData: [],
    online: null,
    bciState: "Not Connected",
    brain: "",
    brainContainer: {
      width: null,
      height: null
    }
  };

  render() {
    return (
      <Context.Provider
        value={{
          subjects: this.state.subjects,
          setAllSubjects: allSubjects => {
            this.setState({
              subjects: allSubjects
            });
          },
          subject: this.state.subject,
          setNewSubject: newSubject => {
            this.setState({
              subject: newSubject
            });
          },
          records: this.state.records,
          setAllRecords: allRecords => {
            this.setState({
              records: allRecords
            });
          },
          record: this.state.record,
          setNewRecord: newRecord => {
            this.setState({ record: newRecord });
          },
          brain: this.state.brain,
          setNewBrain: newBrain => {
            this.setState({ brain: newBrain });
          },
          brainContainer: this.state.brainContainer,
          setBrainSize: size => {
            this.setState({ brainContainer: size });
          },
          sourceData: this.state.sourceData,
          setSourceData: incomingData => {
            this.setState({ sourceData: incomingData });
          },
          filterData: this.state.filterData,
          setFilterData: incomingData => {
            this.setState({ filterData: incomingData });
          },
          online: this.state.online,
          setOnline: state => {
            this.setState({ online: state });
          },
          bciState: this.state.bciState,
          setBciState: state => {
            this.setState({ bciState: state });
          }
        }}>
        {this.props.children}
      </Context.Provider>
    );
  }
}
