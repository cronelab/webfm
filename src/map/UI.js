export default class UI {
    constructor() {
      this.buttonFunctions();
    }
  
    buttonFunctions() {
      document.getElementsByClassName("fm-zoom-in")[0].onclick = () => {
        this.changeBrainSize(4,3,2);
      };
      document.getElementsByClassName("fm-zoom-out")[0].onclick = () => {
        this.changeBrainSize(-4,-3,2);
      };
      document.getElementsByClassName("fm-gain-up")[0].onclick = () => {
        console.log("gU button pressed");
      };
      document.getElementsByClassName("fm-gain-down")[0].onclick = () => {
        console.log("gD button pressed");
      };
      document.getElementById("play-button").onclick = () => {
        console.log("play button pressed");
      };
  
      document.getElementById('toggle2D').parentElement.onclick = () => {
        document.getElementById('fm-brain-3D').classList.add('d-none')
        document.getElementById('fm-brain-2D').classList.remove('d-none')
      }
      document.getElementById('toggle3D').parentElement.onclick = () => {
        document.getElementById('fm-brain-2D').classList.add('d-none')
        document.getElementById('fm-brain-3D').classList.remove('d-none')
      }
  
    }
  
    changeBrainSize(val1, val2, factor){
      let fmBrain = document.getElementById('fm-brain');
      fmBrain.width =fmBrain.width + val1*factor
      fmBrain.height = fmBrain.height + val2*factor
    }
  
  
  
    buttonForms() {
      $("#fm-options-modal").on("hidden.bs.modal", function(event) {
        manager.optionsHidden(event);
      });
  
      // TODO Manually handling radio because my markup is dumb
      $("#fm-option-stim-timing-state").on("click", function(event) {
        $("#fm-option-stim-timing-state").prop("checked", true);
        $("#fm-option-stim-timing-signal").prop("checked", false);
  
        updateOptions(function(options) {
          options.stimulus.timingStrategy = "state";
        });
        manager.onoptionchange("stim-timing", "state");
      });
      $("#fm-option-stim-timing-signal").on("click", function(event) {
        $("#fm-option-stim-timing-state").prop("checked", false);
        $("#fm-option-stim-timing-signal").prop("checked", true);
  
        updateOptions(function(options) {
          options.stimulus.timingStrategy = "signal";
        });
        manager.onoptionchange("stim-timing", "signal");
      });
  
      $("#fm-option-stim-channel").on("change", function(event) {
        var newValue = this.value;
        updateOptions(function(options) {
          options.stimulus.signal.channel = newValue;
        });
        manager.onoptionchange("stim-channel", newValue);
      });
      $("#fm-option-stim-off").on("change", function(event) {
        var newValue = +this.value;
        updateOptions(function(options) {
          options.stimulus.signal.offValue = newValue;
        });
        manager.onoptionchange("stim-off", newValue);
      });
      $("#fm-option-stim-on").on("change", function(event) {
        var newValue = +this.value;
        updateOptions(function(options) {
          options.stimulus.signal.onValue = newValue;
        });
        manager.onoptionchange("stim-on", newValue);
      });
  
      $("#fm-option-nuke-cookies").on("click", function(event) {
        manager.clearOptions();
        manager.clearExclusion();
      });
  
      // Scope page
  
      var stimElements = document.getElementsByClassName("stimulusSelector");
      Array.from(stimElements).forEach(function(stimelement) {
        stimelement.addEventListener("click", function(e) {
          stimelement.parentElement.classList.toggle("active", "force");
          manager.updateScopeChannel(stimelement.innerText);
        });
      });
  
      $("#fm-button").on("click", function(event) {
        // Deactivate the tab list
        $(".fm-options-tab-list .list-group-item").removeClass("active");
  
        // TODO Get Bootstrap events for tab show / hide to work
        // Selected tab is last word of hash
        var scopeChannel = $("#fm-option-scope-channel").val();
  
        manager.scope.setup(); // TODO Necessary?
        manager.scope.start("LAO3" ? "LAO3" : undefined);
  
        // console.log(document.getElementById('chanSel'))
        //   manager.updateScopeChannel( "LAO1" );
      });
  
      $("#fm-option-scope-channel").on("change", function(event) {
        manager.updateScopeChannel(this.value);
      });
  
      $("#fm-option-scope-min").on("change", function(event) {
        manager.updateScopeMin(this.value == "" ? null : +this.value);
      });
      $("#fm-option-scope-max").on("change", function(event) {
        manager.updateScopeMax(this.value == "" ? null : +this.value);
      });
    }
  }
  