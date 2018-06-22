function [sensorLocs] = markElectrodesStructSnap(brainImage, channelNames, varargin)% findCenters)
% this is a function that makes generating coordinates (i.e., sensorLocs
% output) of electrode locations on an image (i.e., brainImage) easier by
% prompting with each channel name, and turning red if a number is skipped
% (e.g., LFG1->LFG3)
% 
% Inputs:
%   brainImage: an image capable of being plotted using imshow, should be a
%       NxMx3 matrix
%   channelNames: a Cx1 cell array of strings containing channel names to
%       be manually marked
%
% Outputs:
%   sensorLocs: a Sx2 matrix, where the first column is the horizontal (x)
%       coordinate of each electrode, and the second column is the vertical
%       (y) coordinate

% use a helper function if electrodes are the exact same color throughout

DefaultSwitch = true;
DefaultPYN = 'NA';

p = inputParser;

addRequired(p,'brainImage');
addRequired(p,'channelNames');
addParameter(p,'findCenters',DefaultSwitch, @islogical);
addParameter(p,'PYN',DefaultPYN, @ischar);

parse(p,brainImage,channelNames,varargin{:});

brainImage = p.Results.brainImage;
channelNames = p.Results.channelNames;
findCenters = p.Results.findCenters;
PYN = p.Results.PYN;

if findCenters
    bwImg = im2bw(brainImage,0.99);
    CC = bwconncomp(bwImg); 
    S = regionprops(CC,'Centroid');
    possibleSensorLocs = [];
    for i = 1:numel(S)
        if numel(CC.PixelIdxList{i})<500 && numel(CC.PixelIdxList{i})>10
            possibleSensorLocs = [possibleSensorLocs;S(i).Centroid];
            plot(S(i).Centroid(1),S(i).Centroid(2),'rx');
        end
    end
end

% an annoying glitch that happens sometimes in adobe, this is a good place
% to warn the user
if length(size(brainImage)) < 3
    warning('brainImage does not have full RGB color. You may need to re-save it.');
end

% this accessor function is needed in MATLAB for cellfun
getLastCell = @(x) x{end};
getLast = @(x) x(end);
channelNums = cellfun(@(x) str2num(getLastCell(regexp(x, '[0-9]+', 'match'))), channelNames);
channelBanks = cellfun(@(x) x(1:getLast(regexp(x, '[0-9]+'))-1), channelNames, 'UniformOutput', 0);
imshow(brainImage);
hold on;

if findCenters
    for i = 1:size(possibleSensorLocs,1)
        plot(possibleSensorLocs(i,1),possibleSensorLocs(i,2),'g.');
    end
end


sensorLocs = struct();
for loop = 1 : length(channelNames)
    
    % get the next bank...if bank changed or number discontinuity, make
    % title red
    if loop == 1 || ~isequal(channelBanks{loop-1}, channelBanks{loop}) || channelNums(loop) - channelNums(loop-1) ~= 1
        title(channelNames{loop}, 'FontWeight', 'bold', 'Color', 'r', 'FontSize', 16);
    else
        title(channelNames{loop}, 'FontWeight', 'bold', 'Color', 'k', 'FontSize', 16);
    end
    
    % get the next point, and put text there
    [sensorLocs.(channelNames{loop})(1), sensorLocs.(channelNames{loop})(2)] = ginput(1);
    if findCenters && sensorLocs.(channelNames{loop})(1)>0 && sensorLocs.(channelNames{loop})(2)>0
        % Move the ginput point to the nearest centroid from a list of
        % possible electrode locations
        k = dsearchn(possibleSensorLocs, sensorLocs.(channelNames{loop}));
        sensorLocs.(channelNames{loop}) = possibleSensorLocs(k,:);
    end
    text(sensorLocs.(channelNames{loop})(1), sensorLocs.(channelNames{loop})(2), channelNames{loop}, 'HorizontalAlignment', 'center', 'FontSize', 8, 'Color', 'r');
%     text(sensorLocs.(channelNames{loop})(1), sensorLocs.(channelNames{loop})(2), '+', 'HorizontalAlignment', 'center', 'FontSize', 8, 'Color', 'r');
end

if ~strcmp(PYN,'NA')
    
    TableToWrite = cell2table([fieldnames(sensorLocs),struct2cell(sensorLocs)]);
    [XDim,YDim,~] = size(brainImage);
    filename = [PYN,'_CCEPs_',sprintf('%dx%d',[XDim,YDim]),'.xls'];
    writetable(TableToWrite,filename,'writeVariableNames',0);
    
    TableToWrite.Var2(:,1) = TableToWrite.Var2(:,1)/YDim;
    TableToWrite.Var2(:,2) = 1-TableToWrite.Var2(:,2)/XDim;    
    filename = [PYN, '.csv'];
    writetable(TableToWrite,filename,'writeVariableNames',0);

end

