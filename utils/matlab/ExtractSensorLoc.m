function varargout = ExtractSensorLoc(varargin)
% EXTRACTSENSORLOC MATLAB code for ExtractSensorLoc.fig
%      EXTRACTSENSORLOC, by itself, creates a new EXTRACTSENSORLOC or raises the existing
%      singleton*.
%
%      H = EXTRACTSENSORLOC returns the handle to a new EXTRACTSENSORLOC or the handle to
%      the existing singleton*.
%
%      EXTRACTSENSORLOC('CALLBACK',hObject,eventData,handles,...) calls the local
%      function named CALLBACK in EXTRACTSENSORLOC.M with the given input arguments.
%
%      EXTRACTSENSORLOC('Property','Value',...) creates a new EXTRACTSENSORLOC or raises the
%      existing singleton*.  Starting from the left, property value pairs are
%      applied to the GUI before ExtractSensorLoc_OpeningFcn gets called.  An
%      unrecognized property name or invalid value makes property application
%      stop.  All inputs are passed to ExtractSensorLoc_OpeningFcn via varargin.
%
%      *See GUI Options on GUIDE's Tools menu.  Choose "GUI allows only one
%      instance to run (singleton)".
%
% See also: GUIDE, GUIDATA, GUIHANDLES

% Edit the above text to modify the response to help ExtractSensorLoc

% Last Modified by GUIDE v2.5 04-Feb-2019 09:55:19

% Begin initialization code - DO NOT EDIT
gui_Singleton = 1;
gui_State = struct('gui_Name',       mfilename, ...
                   'gui_Singleton',  gui_Singleton, ...
                   'gui_OpeningFcn', @ExtractSensorLoc_OpeningFcn, ...
                   'gui_OutputFcn',  @ExtractSensorLoc_OutputFcn, ...
                   'gui_LayoutFcn',  [] , ...
                   'gui_Callback',   []);
if nargin && ischar(varargin{1})
    gui_State.gui_Callback = str2func(varargin{1});
end

if nargout
    [varargout{1:nargout}] = gui_mainfcn(gui_State, varargin{:});
else
    gui_mainfcn(gui_State, varargin{:});
end
% End initialization code - DO NOT EDIT


% --- Executes just before ExtractSensorLoc is made visible.
function ExtractSensorLoc_OpeningFcn(hObject, eventdata, handles, varargin)
% This function has no output args, see OutputFcn.
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% varargin   command line arguments to ExtractSensorLoc (see VARARGIN)

% Choose default command line output for ExtractSensorLoc
handles.output = hObject;

% Update handles structure
guidata(hObject, handles);

% UIWAIT makes ExtractSensorLoc wait for user response (see UIRESUME)
% uiwait(handles.figure1);


% --- Outputs from this function are returned to the command line.
function varargout = ExtractSensorLoc_OutputFcn(hObject, eventdata, handles) 
% varargout  cell array for returning output args (see VARARGOUT);
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Get default command line output from handles structure
varargout{1} = handles.output;


% --- Executes on selection change in lbChannelNames.
function lbChannelNames_Callback(hObject, eventdata, handles)
% hObject    handle to lbChannelNames (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Hints: contents = cellstr(get(hObject,'String')) returns lbChannelNames contents as cell array
%        contents{get(hObject,'Value')} returns selected item from lbChannelNames

channelNames = handles.UsrData.channelNames;

if isfield(handles.UsrData,'sensorLocs') && isfield(handles.UsrData.sensorLocs,channelNames(get(handles.lbChannelNames,'value')))
    UpdateMapAx(handles.hMapAx,handles);
    set(handles.pbMoveUp,'enable','on');
    set(handles.pbMoveDown,'enable','on');
    set(handles.pbMoveLeft,'enable','on');
    set(handles.pbMoveRight,'enable','on');
    set(handles.tbStepSize,'enable','on');
else
    set(handles.pbMoveUp,'enable','off');
    set(handles.pbMoveDown,'enable','off');
    set(handles.pbMoveLeft,'enable','off');
    set(handles.pbMoveRight,'enable','off');
    set(handles.tbStepSize,'enable','off');
end



% --- Executes during object creation, after setting all properties.
function lbChannelNames_CreateFcn(hObject, eventdata, handles)
% hObject    handle to lbChannelNames (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called

% Hint: listbox controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end


% --- Executes on button press in pbLoadChannelNames.
function pbLoadChannelNames_Callback(hObject, eventdata, handles)
% hObject    handle to pbLoadChannelNames (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

[filename,pathname] = uigetfile('channelNames.mat');

tmp = load(fullfile(pathname,filename),'channelNames');
channelNames = tmp.channelNames;

channelBank = cell(size(channelNames));
for i = 1:numel(channelNames)
    channelBank{i} = channelNames{i}(isstrprop(channelNames{i},'alpha'));
end
channelBank = unique(channelBank,'stable');

set(handles.lbChannelNames,'string',channelNames);

handles.UsrData.channelNames = channelNames;
handles.UsrData.channelBank = channelBank;

set(handles.txtFirst,'string','1');
set(handles.txtLast,'string',num2str(numel(channelNames)));
set(handles.pbLoadBrainImage,'enable','on');
set(handles.pbSetFirst,'enable','on');
set(handles.pbSetLast,'enable','on');

guidata(hObject, handles);



% --- Executes on button press in pbLoadBrainImage.
function pbLoadBrainImage_Callback(hObject, eventdata, handles)
% hObject    handle to pbLoadBrainImage (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
[filename,pathname] = uigetfile('brainImage.mat');

tmp = load(fullfile(pathname,filename),'brainImage');
brainImage = tmp.brainImage;

handles.UsrData.brainImage = brainImage;

possibleSensorLocs = UpdateMapAx(handles.hMapAx, handles);

handles.UsrData.possibleSensorLocs = possibleSensorLocs;

set(handles.pbLocateElectrodes,'enable','on');

guidata(hObject, handles);

% --- Executes on button press in pbLocateElectrodes.
function pbLocateElectrodes_Callback(hObject, eventdata, handles)
% hObject    handle to pbLocateElectrodes (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

channelNames = handles.UsrData.channelNames;
channelBank = handles.UsrData.channelBank;
possibleSensorLocs = handles.UsrData.possibleSensorLocs;

if isfield(handles.UsrData,'sensorLocs')
    sensorLocs = handles.UsrData.sensorLocs;
end


FirstID = round(str2double(get(handles.txtFirst,'string')));
LastID = round(str2double(get(handles.txtLast,'string')));

set(handles.lbChannelNames,'value',FirstID);


for loop = FirstID:LastID    
    % get the next point, and put text there
    [sensorLocs.(channelNames{loop})(1), sensorLocs.(channelNames{loop})(2)] = ginputax(handles.hMapAx,1);
    if sensorLocs.(channelNames{loop})(1)>0 && sensorLocs.(channelNames{loop})(2)>0
        % Move the ginput point to the nearest centroid from a list of
        % possible electrode locations
        k = dsearchn(possibleSensorLocs, sensorLocs.(channelNames{loop}));
        sensorLocs.(channelNames{loop}) = possibleSensorLocs(k,:);
    end
    handles.UsrData.sensorLocs = sensorLocs;
    UpdateMapAx(handles.hMapAx,handles);
    if loop<length(channelNames)
        set(handles.lbChannelNames,'value',min(loop+1,numel(channelNames)));
    end
end

set(handles.pbExportFiles,'enable','on');
set(handles.pbShowAllLabels,'enable','on');

if isfield(sensorLocs,channelNames(get(handles.lbChannelNames,'value')))
    set(handles.pbMoveUp,'enable','on');
    set(handles.pbMoveDown,'enable','on');
    set(handles.pbMoveLeft,'enable','on');
    set(handles.pbMoveRight,'enable','on');
    set(handles.tbStepSize,'enable','on');
end


LastIDChannelBankName = channelNames{LastID}(isstrprop(channelNames{LastID},'alpha'));
LastIDChannelBankID = find(contains(channelBank,LastIDChannelBankName));

CurrentBankChannelIDs = find(contains(channelNames,LastIDChannelBankName));

if LastID == CurrentBankChannelIDs(end)
    NextBankName = channelBank{min(LastIDChannelBankID+1,numel(channelBank))};
else
    NextBankName = LastIDChannelBankName;
end

NextBankChannelIDs = find(contains(channelNames,NextBankName));

set(handles.txtFirst,'string',num2str(min(numel(channelNames),max(NextBankChannelIDs(1),LastID+1))));
set(handles.txtLast,'string',num2str(NextBankChannelIDs(end)));


guidata(hObject, handles);

% --- Executes on button press in pbExportFiles.
function pbExportFiles_Callback(hObject, eventdata, handles)
% hObject    handle to pbExportFiles (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

if isfield(handles.UsrData,'PYN')
    PYN = inputdlg('Enter Patient Number','Prompt',1,{handles.UsrData.PYN});
else
    PYN = inputdlg('Enter Patient Number','Prompt',1);
end
PYN = PYN{1};

sensorLocs = handles.UsrData.sensorLocs;
brainImage = handles.UsrData.brainImage;

TableToWrite = cell2table([fieldnames(sensorLocs),struct2cell(sensorLocs)]);
[XDim,YDim,~] = size(brainImage);
filename = [PYN,'_CCEPs_',sprintf('%dx%d',[XDim,YDim]),'.xls'];
writetable(TableToWrite,filename,'writeVariableNames',0);

TableToWrite.Var2(:,1) = TableToWrite.Var2(:,1)/YDim;
TableToWrite.Var2(:,2) = 1-TableToWrite.Var2(:,2)/XDim;
filename = [PYN, '.csv'];
writetable(TableToWrite,filename,'writeVariableNames',0);

handles.UsrData.PYN = PYN;
guidata(hObject, handles);

% --- Executes on button press in pbMoveLeft.
function pbMoveLeft_Callback(hObject, eventdata, handles)
% hObject    handle to pbMoveLeft (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

sensorLocs = handles.UsrData.sensorLocs;
channelNames = handles.UsrData.channelNames;
stepSize = round(str2double(get(handles.tbStepSize,'string')));


currElectrode = channelNames{get(handles.lbChannelNames,'value')};
sensorLocs.(currElectrode)(1) = sensorLocs.(currElectrode)(1) - stepSize;

handles.UsrData.sensorLocs = sensorLocs;
UpdateMapAx(handles.hMapAx,handles);

guidata(hObject, handles);


% --- Executes on button press in pbMoveRight.
function pbMoveRight_Callback(hObject, eventdata, handles)
% hObject    handle to pbMoveRight (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

sensorLocs = handles.UsrData.sensorLocs;
channelNames = handles.UsrData.channelNames;
stepSize = round(str2double(get(handles.tbStepSize,'string')));

currElectrode = channelNames{get(handles.lbChannelNames,'value')};
sensorLocs.(currElectrode)(1) = sensorLocs.(currElectrode)(1) + stepSize;

handles.UsrData.sensorLocs = sensorLocs;
UpdateMapAx(handles.hMapAx,handles);

guidata(hObject, handles);

% --- Executes on button press in pbMoveUp.
function pbMoveUp_Callback(hObject, eventdata, handles)
% hObject    handle to pbMoveUp (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

sensorLocs = handles.UsrData.sensorLocs;
channelNames = handles.UsrData.channelNames;
stepSize = round(str2double(get(handles.tbStepSize,'string')));

currElectrode = channelNames{get(handles.lbChannelNames,'value')};
sensorLocs.(currElectrode)(2) = sensorLocs.(currElectrode)(2) - stepSize;

handles.UsrData.sensorLocs = sensorLocs;
UpdateMapAx(handles.hMapAx,handles);

guidata(hObject, handles);

% --- Executes on button press in pbMoveDown.
function pbMoveDown_Callback(hObject, eventdata, handles)
% hObject    handle to pbMoveDown (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

sensorLocs = handles.UsrData.sensorLocs;
channelNames = handles.UsrData.channelNames;
stepSize = round(str2double(get(handles.tbStepSize,'string')));

currElectrode = channelNames{get(handles.lbChannelNames,'value')};
sensorLocs.(currElectrode)(2) = sensorLocs.(currElectrode)(2) + stepSize;

handles.UsrData.sensorLocs = sensorLocs;
UpdateMapAx(handles.hMapAx,handles);

guidata(hObject, handles);


function tbStepSize_Callback(hObject, eventdata, handles)
% hObject    handle to tbStepSize (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Hints: get(hObject,'String') returns contents of tbStepSize as text
%        str2double(get(hObject,'String')) returns contents of tbStepSize as a double


% --- Executes during object creation, after setting all properties.
function tbStepSize_CreateFcn(hObject, eventdata, handles)
% hObject    handle to tbStepSize (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called

% Hint: edit controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end

% --- Executes on button press in pbSetFirst.
function pbSetFirst_Callback(hObject, eventdata, handles)
% hObject    handle to pbSetFirst (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

set(handles.txtFirst,'string',get(handles.lbChannelNames,'Value'));



% --- Executes on button press in pbSetLast.
function pbSetLast_Callback(hObject, eventdata, handles)
% hObject    handle to pbSetLast (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
set(handles.txtLast,'string',get(handles.lbChannelNames,'Value'));


% --- Executes on button press in pbShowAllLabels.
function pbShowAllLabels_Callback(hObject, eventdata, handles)
% hObject    handle to pbShowAllLabels (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

UpdateMapAx(handles.hMapAx,handles,'ShowLabels','on');










function possibleSensorLocs = UpdateMapAx(Ax, handles,varargin)

defaultSwitch = 'off';

expectedSwitches={'on','off'};

p = inputParser;

addRequired(p, 'Ax');
addRequired(p,'handles');
addParameter(p,'ShowLabels', defaultSwitch, @(x) any(validatestring(x,expectedSwitches)));

parse(p, Ax, handles, varargin{:});

Ax = p.Results.Ax;
handles = p.Results.handles;
ShowLabels = p.Results.ShowLabels;


brainImage = handles.UsrData.brainImage;

cla(Ax);

imshow(brainImage,'Parent',Ax); hold(Ax,'on');


if ~isfield(handles.UsrData,'possibleSensorLocs')
    bwImg = im2bw(brainImage,0.99);
    CC = bwconncomp(bwImg);
    S = regionprops(CC,'Centroid');
    possibleSensorLocs = [];
    for i = 1:numel(S)
        if numel(CC.PixelIdxList{i})<500 && numel(CC.PixelIdxList{i})>10
            possibleSensorLocs = [possibleSensorLocs;S(i).Centroid];
        end
    end
else
    possibleSensorLocs = handles.UsrData.possibleSensorLocs;
end
    
for i = 1:size(possibleSensorLocs,1)
    plot(handles.hMapAx,possibleSensorLocs(i,1),possibleSensorLocs(i,2),'r.');
end

if isfield(handles.UsrData,'sensorLocs')
    sensorLocs = handles.UsrData.sensorLocs;
    AvailableChannelNames = fieldnames(sensorLocs);
    for i = 1:size(AvailableChannelNames,1)
        plot(Ax,sensorLocs.(AvailableChannelNames{i})(1), sensorLocs.(AvailableChannelNames{i})(2),'b.');
    end
    if strcmp(ShowLabels,'off') 
        channelNames = handles.UsrData.channelNames;
        currChannel = get(handles.lbChannelNames,'value');
        text(Ax, sensorLocs.(channelNames{currChannel})(1), sensorLocs.(channelNames{currChannel})(2), channelNames{currChannel}, ...
            'HorizontalAlignment', 'center', ...
            'VerticalAlignment','top',...
            'FontSize', 16, 'Color', 'b');
    else
        for i = 1:size(AvailableChannelNames,1)
            text(Ax,sensorLocs.(AvailableChannelNames{i})(1), sensorLocs.(AvailableChannelNames{i})(2),AvailableChannelNames{i}, ...
            'HorizontalAlignment', 'center', ...
            'VerticalAlignment','top',...
            'FontSize', 8, 'Color', 'b');
        end
    end
end
