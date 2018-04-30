/*jshint esversion: 6 */
const fabCanvas = new fabric.Canvas('c');

fabCanvas.setWidth(window.innerWidth);
fabCanvas.setHeight(window.innerHeight);

var editGroup = null;
var seatEditing = false;

// resize canvas when window resizes
$(window).resize(function() {
    fabCanvas.setWidth( window.innerWidth );
    fabCanvas.setHeight( window.innerHeight);
    fabCanvas.calcOffset();
});

// canvas zooming
fabCanvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = fabCanvas.getZoom();
    zoom = zoom + delta/800;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    fabCanvas.setZoom(zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
})

function removeSeat() {
    bus.$emit('sigRemoveSeat',[]);
};

function editSeating() {
    bus.$emit('sigEditSeating',  []);
};

function regroupSeating() {
    bus.$emit('sigRegroupSeating',  []);
};
// canvas panning - adapted from http://jsfiddle.net/gncabrera/hkee5L6d/5/
// pans with mouse click only
// var panning = false;
// fabCanvas.on('mouse:up', function(e) {
//     panning = false;
// });
// fabCanvas.on('mouse:down', function(e) {
//     if (e.target == null) {
//         panning = true;
//     }
// });
// fabCanvas.on('mouse:move', function (e) {
//     if (panning && e && e.e) {
//         //debugger;
//         var units = 10;
//         var delta = new fabric.Point(e.e.movementX, e.e.movementY);
//         fabCanvas.relativePan(delta);
//     }
// });

// pans with alt key
fabCanvas.on('mouse:down', function(opt) {
  var evt = opt.e;
  if (evt.altKey === true) {
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  }
  if(!fabCanvas.getActiveObject()){
        $(".popup").remove();
    }
});
fabCanvas.on('mouse:move', function(opt) {
  if (this.isDragging) {
    var e = opt.e;
    this.viewportTransform[4] += e.clientX - this.lastPosX;
    this.viewportTransform[5] += e.clientY - this.lastPosY;
    this.renderAll();
    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
  }
});
fabCanvas.on('mouse:up', function(opt) {
  this.isDragging = false;
  this.selection = true;
});
fabCanvas.on('object:selected', function(e){
    if(e.target.type=="circle") {
        bus.$emit('sigAddSeatPopup', [e.target.oCoords.mt.x, e.target.oCoords.mt.y, e.target.width]);
    } else {
        bus.$emit('sigAddSectionPopup', [e.target.oCoords.mt.x, e.target.oCoords.mt.y, e.target.width]);
    }
});
fabCanvas.on('object:modified',function(e){
    if(e.target.type=="circle") {
        bus.$emit('sigAddSeatPopup', [e.target.oCoords.mt.x, e.target.oCoords.mt.y, e.target.width]);
    } else {
        bus.$emit('sigAddSectionPopup', [e.target.oCoords.mt.x, e.target.oCoords.mt.y, e.target.width]);
    }
});
fabCanvas.on('object:moving',function(e){
    $(".popup").remove();
});

// adds custom properties to fabric Rect class
fabric.Rect.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            price: this.price,
            groupId: this.groupId,
            seatType: this.seatType,
            roundSeats: this.roundSeats,
            xSeats: this.xSeats,
            ySeats: this.ySeats
        });
    };
})(fabric.Rect.prototype.toObject);

// adds custom properties to fabric IText class
fabric.IText.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            groupId: this.groupId,
        });
    };
})(fabric.IText.prototype.toObject);

// adds custom properties to fabric Circle class
fabric.Circle.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            price: this.price,
            groupId: this.groupId,
            rowName: this.rowName,
            colName: this.colName,
            deleted: this.deleted,
            seatType: this.seatType,
        });
    };
})(fabric.Circle.prototype.toObject);

// adds customm properties to fabric Group class
fabric.Group.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            sectionType: this.sectionType,
            rows: this.rows,
            cols: this.cols,
            rowStart: this.rowStart,
            colStart: this.colStart,

        });
    };
})(fabric.Group.prototype.toObject);

// a vue bus instance that is used to communicate between
// vue applications and vue components using signals
// that are defined inside the create methods of each party
// signals are decided upon up front.
var bus = new Vue();

// where to create new objects
var startX = 200;
var startY = 100;

// vue component for the add seating form
Vue.component('add-form',{
    template: '#add-form',
//    template: '#section-type',
    data(){
        return{
            sectionName: "default name",
            seatingType: "Normal",
            sectionType: "Seating",
            tableType: "round",
            roundSeats: 4,
            xSeats: 2,
            ySeats: 2,
            columns: 5,
            rows: 5,
            colStart: 1,
            rowStart: "A",
            color: "ffffff",
            showAddSeatForm: false,
            price: 0
        };
    },
    methods: {
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitSeatingData() {
            // console.log("submit seat data");
            // console.log(this.sectionType);
            // emit a Make Seating bus signal; or place a passenger on the bus carrying the
            // parameters to make a seating section. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            // console.log(this.sectionType);
            if(this.sectionType=="Seating")
                bus.$emit('sigMakeSeating',startX,startY,this.columns, this.rows, this.sectionName, this.seatingType, this.colStart, this.rowStart, parseInt(this.price));
            else if(this.sectionType=="Table")
                bus.$emit('sigMakeTable',startX,startY,this.tableType, this.roundSeats, this.xSeats, this.ySeats, this.sectionName, this.seatingType, parseInt(this.price));
            else if(this.sectionType=="General")
                bus.$emit('sigMakeGeneral',startX,startY,300,200, this.sectionName, this.color, parseInt(this.price));

            // set toggle the seating forms visibility since the seating section has been created.
            this.showAddSeatForm = false;
        }
    },
    // function that launches when Forms component is created
    // signal listeners must be initialized on component creation
    created() {
        // a "bus stop" signal listener for toggling the visibility of the add seating form.
        bus.$on('sigAddSeatFormOn', () => {
            this.showAddSeatForm = true;
        });
        // a bus listener for toggling the visibility of both forms when 
        // the delete seating signal is received.
        bus.$on('sigAddSeatFormOff', () => {
            this.showAddSeatForm = false;
        });
    },
});

Vue.component('edit-form', {
    template: '#edit-form',
    data() {
        return {
            sectionName: "",
            seatingType: "",
            sectionType: "",
            tableType: "",
            seatType: "",
            roundSeats: this.roundSeats,
            xSeats: this.xSeats,
            ySeats: this.ySeats,
            columns: this.columns,
            rows: this.rows,
            sectionColor: "",
            cols: this.cols,
            colStart: 1,
            rowStart: "A",
            posX: this.posX,
            posY: this.posY,
            showEditSeatingForm: false,
            price: 0
        };
    },
    methods:{
        addSeatPopupMenu(x,y,w) {
            $(".popup").remove();
            var btnLeft = x;
            var btnTop = y - 25;
            var widthadjust=w/2;
            var removeSeat = "removeSeat"
            btnLeft = widthadjust+btnLeft-25;
            var popup = "<ul id='popup' class='popup' style='position:absolute;top:"+btnTop+"px;left:"+btnLeft+"px;cursor:pointer;'>" +
                            '<button class="btn" type="button" onclick="removeSeat();">Delete</button>' +
                        "</ul>";
            $(".canvas-container").append(popup);
        },
        addSectionPopupMenu(x,y,w) {
            $(".popup").remove();
            var btnLeft = x;
            var btnTop = y - 25;
            var widthadjust=w/2;
            var removeSeat = "removeSeat"
            btnLeft = widthadjust+btnLeft-25;
            var popup = "<ul id='popup' class='popup' style='position:absolute;top:"+btnTop+"px;left:"+btnLeft+"px;cursor:pointer;'>" +
                            '<button class="btn" type="button" onclick="editSeating();">Edit Seats</button><br>' +
                            '<button class="btn" type="button" onclick="regroupSeating();">Stop Editing</button>' +
                        "</ul>";
            $(".canvas-container").append(popup);
        },
        submitEditSeating(){
            //console.log(fabCanvas.getActiveObject())
            //console.log(fabCanvas.getActiveObject().calcCoords())
            if (fabCanvas.getActiveObject() != null) {
                var coords = fabCanvas.getActiveObject().calcCoords();
                var object = fabCanvas.getActiveObject();
                // console.log("section Name Edit");
                // console.log(object);
                // &&(object.sectionType == "seating")
                vm.deleteSeating();
                if((this.sectionType=="Seating")){
                    bus.$emit('sigMakeSeating', coords.tl.x, coords.tl.y,this.columns, this.rows, this.sectionName, this.seatingType, this.colStart, this.rowStart, this.price);
                }
                else if(this.sectionType=="Table"){
                    bus.$emit('sigMakeTable', coords.tl.x, coords.tl.y,this.tableType, this.roundSeats, this.xSeats, this.ySeats, this.sectionName, this.seatingType, this.price);
                }
                else if(this.sectionType=="General"){
                    bus.$emit('sigMakeGeneral', coords.tl.x, coords.tl.y,300,200, this.sectionName, this.sectionColor, this.price);
                }
            }
        },
        seatEdit(){
            //console.log(fabCanvas.getActiveObject())

            var selectedGroup = fabCanvas.getActiveObject();
            // console.log(selectedGroup);
            if(selectedGroup != null){
                editGroup = selectedGroup.getObjects();
                selectedGroup._restoreObjectsState();
                fabCanvas.remove(selectedGroup);
                
                for (var i = 0; i < editGroup.length; i++) {   
                    fabCanvas.add(editGroup[i]);
                    editGroup[i].dirty = true;
                    editGroup[i].lockMovementX = true;
                    editGroup[i].lockMovementY = true;
                    fabCanvas.item(fabCanvas.size()-1).hasControls = false;
                }
                // if you have disabled render on addition
                fabCanvas.renderAll();
                seatEditing = true;
            }
        },
        regroupEdit(){
            //console.log(editGroup);
            if(editGroup!=null){
                for(var i = 0; i < editGroup.length; i++){
                    editGroup[i].lockMovementX = false;
                    editGroup[i].lockMovementY = false;
                    fabCanvas.remove(editGroup[i])
                }
                var group = new fabric.Group(editGroup, {
                    lockScalingX: true,
                    lockScalingY: true
                });
                fabCanvas.add(group)
                fabCanvas.renderAll();
                editGroup = null;
                seatEditing = false;
            }
            // for(var i = 0; i < fabCanvas._objects.length; i++){
            //     console.log(i)
            //     console.log(fabCanvas._objects[i])
            // }
        },
        removeSelectedSeat(){
            var seat = fabCanvas.getActiveObject()
            if(seatEditing && !seat.deleted){
                //console.log(seat)
                seat.fill = 'transparent';
                seat.stroke = 'gray';
                seat.dirty = true;
                seat.deleted = true;
                //console.log(seat)
            } else if(seatEditing && seat.deleted){
                if (seat.type == "VIP")
                    color = "green";
                else if (seat.type == "Normal")
                    color = "yellow";
                else if (seat.type == "Economy")
                    color = "blue";
                seat.color = color;
                seat.stroke = 'transparent';
                seat.dirty = true;
                seat.deleted = false;
            }
            fabCanvas.renderAll();
        }
    },
    created() {
        // a bus listener for toggling visibility of the the edit seating form.
        bus.$on('sigEditSeatFormOn', () => {
            this.showEditSeatingForm = true;
            var group = fabCanvas.getActiveObject();
            var groupObjects = group.getObjects();
            
            this.rows = groupObjects[0].rows;
            this.columns = groupObjects[0].cols;
            this.rowStart = groupObjects[0].rowStart;
            this.colStart = groupObjects[0].colStart;
            this.posX = groupObjects[0].left;
            this.posY = groupObjects[0].top;
            this.roundSeats = groupObjects[0].roundSeats;
            this.xSeats = groupObjects[0].xSeats;
            this.ySeats = groupObjects[0].ySeats;
            this.tableType = groupObjects[0].tableType;
            this.sectionName = groupObjects[1].text;
            this.seatingType = groupObjects[0].seatType;
            
            if (group.sectionType == "seating"){ 
                this.sectionType = "Seating";
                this.price = groupObjects[2].price;
            }else if (group.sectionType == "table"){
                this.sectionType = "Table";
                this.price = groupObjects[3].price;
            }else if (group.sectionType == "generalArea"){
                this.sectionType = "General";
                this.sectionColor = groupObjects[0].fill.substring(1);
                this.price = groupObjects[0].price;
            }
        });
        bus.$on('sigEditSeatFormOff', () => {
            this.showEditSeatingForm = false;
        });
        bus.$on('sigAddSeatPopup', (args)=>{
            this.addSeatPopupMenu(args[0], args[1], args[2]);
        });
        bus.$on('sigAddSectionPopup', (args) => {
            this.addSectionPopupMenu(args[0], args[1], args[2]);
        });
        bus.$on('sigRemoveSeat', () => {
            $(".popup").remove();
            this.removeSelectedSeat();
        });
        bus.$on('sigEditSeating', () => {
            $(".popup").remove();
            this.seatEdit();
        });
        bus.$on('sigRegroupSeating', () => {
            $(".popup").remove();
            this.regroupEdit();
        });
    }
});

Vue.component('drop-down-menu', {
    template: '#drop-down-menu',
    data() {
        return {};
    },
    methods: {
        preventDropmenuClosing(e) {
            $('.dropdown-menu').on('click', (e) => {
                // console.log(e);
                // console.log('stopped');
                e.stopPropagation();
            });
        },
        performDownload(){
            // console.log("download performing on "+ name);
            var fileName = "seat-map.json";
            var jsonString = JSON.stringify(fabCanvas);
            // console.log("jsonString:");
            // console.log(jsonString);
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));
            element.setAttribute('download', fileName);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        },
        setAddSeating() {
            // emits a bus signal to toggle the add seating form.
            bus.$emit('sigAddSeatFormOn');
            bus.$emit('sigEditSeatFormOff');
            bus.$emit('sigAddGenFormOff');
            bus.$emit('sigAddTableFormOff');
        },
        setDeleteSeating() {
            // emits a bus signal to toggle both forms off
            bus.$emit('sigAddSeatFormOff');
            bus.$emit('sigEditSeatFormOff');
            // signal the seating to be deleted
            bus.$emit('sigDeleteSeating');
            bus.$emit('sigAddGenFormOff');
            bus.$emit('sigAddTableFormOff');
        },
        setEditTool() {
            // emits a bus signal to toggle the edit seating form
            bus.$emit('sigEditSeatFormOn');
            bus.$emit('sigAddSeatFormOff');
            bus.$emit('sigAddGenFormOff');
            bus.$emit('sigAddTableFormOff');
        },
        // NEW STUFF
        setAddGeneral(){ 
            // emits a bus signal to toggle the add general form.
            bus.$emit('sigAddSeatFormOff');
            bus.$emit('sigEditSeatFormOff');
            bus.$emit('sigAddGenFormOn');
            bus.$emit('sigAddTableFormOff');
        },
        setAddTable(){ 
            // emits a bus signal to toggle the add general form.
            bus.$emit('sigAddSeatFormOff');
            bus.$emit('sigEditSeatFormOff');
            bus.$emit('sigAddGenFormOff');
            bus.$emit('sigAddTableFormOn');
        },
    }
});

Vue.component('add-general-form',{
    template: '#add-general-form',
    data(){
        return{
            sectionName: "test name",
            sectionColor: "ffffff",
            showAddGenForm: false,
        };
    },
    methods:{
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitGeneralData(){
            // console.log("submit seat data");
            // emit a Make Seating bus signal; or place a passenger on the bus carrying the 
            // parameters to make a seating section. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            bus.$emit('sigMakeGeneral',startX,startY,300,200, this.sectionName, this.sectionColor, this.price);

            // set toggle the seating forms visibility since the seating section has been created.
            this.showAddGenForm = false;
        }
    },
    // function that launches when Forms component is created
    // signal listeners must be initialized on component creation
    created(){
        // a "bus stop" signal listener for toggling the visibility of the add seating form.
        bus.$on('sigAddGenFormOn', ()=>{
            this.showAddGenForm = true;
        });

        // a bus listener for toggling the visibility of both forms when 
        // the delete seating signal is received.
        bus.$on('sigAddGenFormOff',()=>{
            this.showAddGenForm = false;
        });
    }, 
});

Vue.component('add-table-form',{
    template: '#add-table-form',
    data(){
        return{
            sectionName: "default name",
            tableType: "round",
            seats: 2,
            xSeats: 5,
            ySeats: 2,
            showAddTableForm: false,
            seatType: "",
            price: 0
        };
    },
    methods:{
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitTableData(){
            // emit a Make Table bus signal; or place a passenger on the bus carrying the 
            // parameters to make a table. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            // console.log("Adding seating");
            bus.$emit('sigMakeTable',startX,startY,this.tableType, this.seats, this.xSeats, this.ySeats, this.sectionName, this.seatType, this.price);

            // set toggle the table forms visibility since the table has been created.
            this.showAddTableForm = false;
        }
    },
    // function that launches when Forms component is created
    // signal listeners must be initialized on component creation
    created(){
        // a "bus stop" signal listener for toggling the visibility of the add table form.
        bus.$on('sigAddTableFormOn', ()=>{
            this.showAddTableForm = true;
        });

        // a bus listener for toggling the visibility of both forms when 
        // the delete table signal is received.
        bus.$on('sigAddTableFormOff',()=>{
            this.showAddTableForm = false;
        });
    }, 
});

var vm = new Vue({
    el: '#vue-app',
    data: {
        groupIdCounter: -1
    },
    methods: {
        makeSeating (posX, posY, cols, rows, name, type, colStart, rowStart, price) {
            // increment the groupIdCounter
            this.groupIdCounter+=1;
            var rad = 10,
                dia = rad * 2,
                gap = 5,
                sideBuff = 10,
                topBuff = 10,
                bottomBuff = 10,
                sizeX = sideBuff * 2 + cols * dia + (cols - 1) * gap,
                sizeY = topBuff + bottomBuff + rows * dia + (rows - 1) * gap;
                currentCol = parseInt(colStart);
                currentRow = rowStart;

            var items = [];

            var container = new fabric.Rect({
                left: posX,
                top: posY,
                originX: 'left',
                originY: 'top',
                stroke: 'transparent',
                fill: 'transparent',
                width: sizeX,
                height: sizeY,
            });
/* EDIT STUFF */
            container.set("rows", rows);
            container.set("cols", cols);
            container.set("seatType", type);
            container.set("sectionType","Seating");
            container.set("colStart", colStart);
            container.set("rowStart", rowStart);
/* EDIT STUFF */
            // set container groupId
            container.groupId = this.groupIdCounter;

            var text = new fabric.IText(name, {
                fontSize: 20,
                fontFamily: 'sans-serif',
                left: (posX + (sizeX / 2)),
                top: (posY + 10),
                originX: 'center',
                originY: 'top',
                hasControls: false
            });
            // set text groupId
            text.groupId = this.groupIdCounter;

            // resize container to accomodate text (maybe just make text box first?)
            container.setHeight(topBuff * 2 + text.height + bottomBuff + rows * dia + (rows - 1) * gap);

            items.push(container);
            items.push(text);
            var color = "";
            if (type == "VIP")
                color = "green";
            else if (type == "Normal")
                color = "yellow";
            else if (type == "Economy")
                color = "blue";
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < cols; j++) {
                    // console.log("adding circle");
                    var circle = new fabric.Circle({
                        radius: rad,
                        left: posX,
                        top: posY,
                        left: (posX + sideBuff) + rad + j * dia + j * gap,
                        top: (text.top + text.height + topBuff) + rad + i * dia + i * gap,
                        originX: 'center',
                        originY: 'center',
                        fill: color,
                    });
                    // set circle groupId
                    circle.groupId = this.groupIdCounter;
                    // set circle seatType
                    // circle.seatType = type;
                    // add price property to circle
                    circle.deleted = false;
                    this.addPriceToObject(circle,price);
                    circle.rowName = currentRow;
                    circle.colName = currentCol;
                    //console.log("created seat " + currentRow + currentCol);

                    items.push(circle);
                    currentCol = currentCol + 1;
                }
                currentCol = parseInt(colStart);;
                currentRow = String.fromCharCode(currentRow.charCodeAt() + 1);
            }
            var group = new fabric.Group(items, {
                lockScalingX: true,
                lockScalingY: true
            });
            // add row to group
            group.rows = rows;
            // add cols to group
            group.cols = cols;
            // adds a section type to seating
            group.sectionType = "seating";

            fabCanvas.add(group);
            fabCanvas.renderAll();

            var ungroup = function (group) {
                groupItems = groupObjects;
                group._restoreObjectsState();
                fabCanvas.remove(group);
                for (var i = 0; i < groupItems.length; i++) {
                    fabCanvas.add(groupItems[i]);
                    items[i].dirty = true;
                    fabCanvas.item(fabCanvas.size()-1).hasControls = false;
                }
                // if you have disabled render on addition
                fabCanvas.renderAll();
            };
        },

        editSeating:function() {
            var selectedGroup = fabCanvas.getActiveObject();
            if (selectedGroup != null){
                editGroup = selectedGroup.getObjects();
                selectedGroup._restoreObjectsState();
                fabCanvas.remove(selectedGroup);
                
                for (var i = 0; i < editGroup.length; i++) {   
                    fabCanvas.add(editGroup[i]);
                    editGroup[i].dirty = true;
                    editGroup[i].lockMovementX = true;
                    editGroup[i].lockMovementY = true;
                    fabCanvas.item(fabCanvas.size()-1).hasControls = false;
                }
                // if you have disabled render on addition
                fabCanvas.renderAll();
                seatEditing = true;
            }
        },

        // removes the currently selected Seat Selection from the fabCanvas.
        deleteSeating () {
            // gets the currently active square
            var seatingToDelete = fabCanvas.getActiveObject();
            // console.log("This is Rect to Delete From Fabric: " + seatingToDelete);
            fabCanvas.remove(seatingToDelete);

            fabCanvas.renderAll();
        },
        post:function(){
            this.$http.post("https://jsonplaceholder.typicode.com/posts",{
                title: this.blog.title,
                body: this.blog.content,
                userId:1
            }).then(function(data){
                // console.log(data);
                this.submitted = true;
            });
        },

        makeGeneral:function(posX, posY, sizeX, sizeY, name, color, price) {
            // increment groupIdCounter
            this.groupIdCounter +=1;
            // console.log("general increment groupCounter"+this.groupIdCounter);
            // console.log("general color: "+color);
            var items = [];
    
            var container = new fabric.Rect({
            left: posX,
            top: posY,
            originX: 'left',
            originY: 'top',
            stroke: 'black',
            fill: '#' + color,
            width: sizeX,
            height: sizeY,
            objectCaching: false
            });
            // set container groupId
            container.groupId = this.groupIdCounter;
            // set container price
            this.addPriceToObject(container, price);

            var text = new fabric.IText(name, {
            fontSize: 20,
            fontFamily: 'sans-serif',
            left: (posX+(sizeX/2)),
            top: (posY+(sizeY/2)),
            originX: 'center', 
            originY: 'top',
            hasControls: false,
            objectCashing: false 
            });
            // set text groupId
            text.groupId = this.groupIdCounter;

            items.push(container);
            items.push(text);

            var group = new fabric.Group(items, {
            lockScalingX: false,
            lockScalingY: false  
            });
            // set section type
            group.sectionType = "generalArea";

            // add table group to fabric canvas for rendering
            fabCanvas.add(group);
            fabCanvas.renderAll();

            // ungroup objects in group
            var groupItems = [];
            var ungroup = function (group) {
                // console.log("in ungroup()");
                groupItems = group.getObjects();
                group._restoreObjectsState();


                fabCanvas.remove(group);
                for (var i = 0; i < groupItems.length; i++) {
                    fabCanvas.add(groupItems[i]);
                    items[i].dirty = true;
                    fabCanvas.item(fabCanvas.size()-1).hasControls = false;
                }
                // if you have disabled render on addition
                fabCanvas.renderAll();
            };
            group.on('modified', function(opt) {
                ungroup(group);
                // get info from current objects
                var sizeX = container.getWidth();
                var sizeY = container.getHeight();
                var posX = container.left;
                var posY = container.top;
                var price = container.price;
                var color = container.fill.slice(1);
                var name = text.get('text');
                // remove current objects
                fabCanvas.remove(container);
                fabCanvas.remove(text);
                // create new object
                bus.$emit('sigMakeGeneral', posX, posY, sizeX, sizeY, name, color, price)
            });

        },
        makeTable:function(posX, posY, type, seats, xSeats, ySeats, name, seatType, price) {
            // increment groupIdCounter
            // console.log("makeTable");
            // console.log(price);
            this.groupIdCounter += 1;

            // make sure seat numbers are integers
            xSeats = parseInt(xSeats);
            ySeats = parseInt(ySeats);
            // seat size
            var rad = 10,
            dia = rad*2,
            gap = 5,
            // buffers from edges of group box
            sideBuff = 10,
            topBuff = 10,
            bottomBuff = 10,
            // size of group box
            sizeX = 10; // doesn't matter, just an initialization
            sizeY = 10; // same
            // items holds all of the object for grouping
            var items = [];
    
            var container = new fabric.Rect({
            left: posX,
            top: posY,
            originX: 'left',
            originY: 'top',
            stroke: 'transparent',
            fill: 'transparent',
            width: sizeX,
            height: sizeY,
            });

            container.set("roundSeats", seats);
            container.set("xSeats", xSeats);
            container.set("ySeats", ySeats);
            container.set("seatType", seatType);
            container.set("sectionType","Table");
            container.set("tableType", type);

            container.on('mouse:over', function(e) {
                e.target.set('stroke', 'black');
                fabCanvas.renderAll();
            });

            container.on('mouse:out', function(e) {
                // console.log(typeof(e));
                e.target.set('stroke', 'transparent');
                fabCanvas.renderAll();
            });
            // set container groupId
            container.groupId = this.groupIdCounter;

            var text = new fabric.IText(name, {
                fontSize: 20,
                fontFamily: 'sans-serif',
                left: (posX),
                top: (posY + topBuff),
                originX: 'center', 
                originY: 'top',
                hasControls: false  
            });
            // set text groupId
            text.groupId = this.groupIdCounter;
            // set the seatType color
            var color = "green";
            if (seatType == "VIP")
                color = "green";
            else if (seatType == "Normal")
                color = "yellow";
            else if (seatType == "Economy")
                color = "blue";
            if (type == 'rect') {

                // calculate height and width of table
                var tableWidth = (1*dia) + (2*gap); // 55 by default
                var tableHeight = tableWidth;       // 55 by default
                if (xSeats >= 1)
                    tableWidth = (xSeats*dia) + ((xSeats+1)*gap);
                if (ySeats >= 1)
                    tableHeight = (ySeats*dia) + ((ySeats+1)*gap);

                wholeWidth = tableWidth;
                if (ySeats > 0)
                    wholeWidth = wholeWidth + dia*2 + gap*2;
                wholeHeight = tableHeight;
                if (xSeats > 0)
                    wholeHeight = wholeHeight + dia*2 + gap*2;

                // resize container to accomodate text and table
                if (text.width > wholeWidth) {
                    contWidth = sideBuff*2 + text.width;
                } else {
                    contWidth = sideBuff*2 + wholeWidth;
                }
                container.setWidth(contWidth);                
                container.setHeight(topBuff*2 + text.height + wholeHeight + bottomBuff);

                // position text in middle of box
                text.setLeft(posX + contWidth/2);

                // build table object
                var table = new fabric.Rect({
                    stroke: 'black',
                    fill: 'white',
                    width: tableWidth,
                    height: tableHeight,
                    left: (posX + container.width/2), 
                    top: (text.top + text.height + topBuff) + (wholeHeight-tableHeight)/2,
                    originX: 'center',
                    originY: 'top'                    
                });
                // set table groupId
                table.groupId = this.groupIdCounter;

                // push initial objects
                items.push(container);
                items.push(text);
                items.push(table);

                // build chairs along x axis
                if (xSeats > 0) {
                    var leftStart = table.left - tableWidth/2 + gap + rad;
                    var topPos = (text.top + text.height + topBuff) + rad;
                    var bottomPos = (text.top + text.height + topBuff) + dia + gap*2 + tableHeight + rad;
                    for (var i = 0; i < xSeats; i++) {
                        var circleT = new fabric.Circle({
                            radius: rad, 
                            fill: color, 
                            left: leftStart + dia*i + gap*i, 
                            top: topPos,
                            originX: 'center',
                            originY: 'center'
                        });
                        var circleB = new fabric.Circle({
                            radius: rad, 
                            fill: color, 
                            left: leftStart + dia*i + gap*i, 
                            top: bottomPos,
                            originX: 'center',
                            originY: 'center'
                        });
                        // set circleT groupId
                        circleT.groupId = this.groupIdCounter;
                        // set circleB groupId
                        circleB.groupId = this.groupIdCounter;
                        // set circleT price
                        this.addPriceToObject(circleT, price);
                        // set circleB price
                        this.addPriceToObject(circleB, price);
                        // set circleT seatType
                        // circleT.seatType = type;
                        // set circleB seatType
                        // circleB.seatType = type;
                        items.push(circleT);
                        items.push(circleB);
                    }
                } // if seats on x axis

                // build chairs along y axis
                if (ySeats > 0) {
                    var topStart = (text.top + text.height + topBuff) + (wholeHeight-tableHeight)/2 + gap + rad;
                    var leftPos = table.left - tableWidth/2 - gap - rad;
                    var rightPos = table.left + tableWidth/2 + gap + rad;
                    for (var i = 0; i < ySeats; i++) {
                        var circleL = new fabric.Circle({
                            radius: rad, 
                            fill: color, 
                            left: leftPos,
                            top: topStart + dia*i + gap*i,
                            originX: 'center',
                            originY: 'center'
                        });
                        var circleR = new fabric.Circle({
                            radius: rad,
                            fill: color, 
                            left: rightPos,
                            top: topStart + dia*i + gap*i,
                            originX: 'center',
                            originY: 'center'
                        });
                        // set circleT groupId
                        circleL.groupId = this.groupIdCounter;
                        // set circleB groupId
                        circleR.groupId = this.groupIdCounter;
                        // set price of circleL
                        this.addPriceToObject(circleL, price);
                        // set price of circleR
                        this.addPriceToObject(circleR, price);
                        // set circleL seatType
                        // circleL.seatType = type;
                        // set circleR seatType
                        // circleR.seatType = type;
                        items.push(circleL);
                        items.push(circleR);
                    }
                } // if seats on y axis
            } // if table = rect

            if (type == 'round') {
                // calculate the size of the table
                var tableRad = rad + gap;
                if (seats >= 4 && seats < 6)
                    tableRad = rad*1.5;
                if (seats >= 6 && seats < 9)
                    tableRad = rad*2;
                if (seats >= 9 && seats < 13)
                    tableRad = rad*3.5;
                wholeDia = tableRad * 2 + dia*2 + gap*2;

                // resize container to accomodate text and table
                if (text.width > wholeDia) {
                    contWidth = sideBuff*2 + text.width;
                } else {
                    contWidth = sideBuff*2 + wholeDia;
                }
                container.setWidth(contWidth);                
                container.setHeight(topBuff*2 + text.height + wholeDia + bottomBuff);

                // position text in middle of box
                text.setLeft(posX + contWidth/2);

                // build table object
               var table = new fabric.Circle({
                    radius: tableRad, 
                    stroke: 'black', 
                    fill: 'white', 
                    left: (posX + container.width/2), 
                    top: (text.top + text.height + topBuff) + dia + gap,
                    originX: 'center',
                    originY: 'top'
                });
                // set table groupId
                table.groupId = this.groupIdCounter;

                // push initial objects
                items.push(container);
                items.push(text);
                items.push(table);

                // build chairs
                var pi = 3.1415926535897932384626433832795;
                var deg = (2*Math.PI)/seats; // uses radians
                for (var i = 0; i < seats; i++) {
                    var angle = deg*i;
                    var xPos = Math.cos(angle)*(tableRad + gap + rad) + table.left;
                    var yPos = Math.sin(angle)*(tableRad + gap + rad) + (table.top + tableRad);

                    var circle = new fabric.Circle({
                        radius: rad, 
                        fill: color, 
                        left: xPos,
                        top: yPos,
                        originX: 'center',
                        originY: 'center'
                    });
                    // set circle groupId
                    circle.groupId = this.groupIdCounter;
                    // set circle price
                    this.addPriceToObject(circle, price);
                    // set circle seatType
                    // circle.seatType = type;

                    items.push(circle);
                }
            }
    
            var group = new fabric.Group(items, {
                lockScalingX: true,
                lockScalingY: true  
            });
            // set group sectionType
            group.sectionType = "table";

            fabCanvas.add(group);
            fabCanvas.renderAll();
        },
        addPriceToObject(object, price){
            // console.log("addPriceToObject adding: "+price);
            // object.stateProperties.push("price");
            // console.log(object.stateProperties);
            if ((price == undefined||(price<0))){
                price = 999999;
            }
            // console.log("addPriceToObject adding: "+price);
            object.price = price;
        },
        RemoveSeat() {
            this.removeSelectedSeat();
        }
    },
    created() {
        // listens for a signal saying to create a new seating section
        bus.$on('sigMakeSeating', (posX, posY, cols, rows, name, type, colStart, rowStart, price) => {
            // console.log(fabCanvas);
            this.makeSeating(posX, posY, cols, rows, name, type, colStart, rowStart, price);

        });
        bus.$on('sigEditSeating', ()=>{
            this.editSeating();
        });
        // listens for a signal saying to delete the seating
        bus.$on('sigDeleteSeating', () => {
            this.deleteSeating();
        });
        // listens for a signal saying to create a new general section
        bus.$on('sigMakeGeneral', (posX, posY, sizeX, sizeY, name, color, price)=>{
            this.makeGeneral(posX, posY, sizeX, sizeY, name, color, price);
        });
        bus.$on('sigMakeTable', (posX, posY, type, seats, xSeats, ySeats, name, seatingType, price)=>{
            // console.log("On Sig Make Table:");
            // console.log("name"+ name);
            // console.log("price"+price);

            this.makeTable(posX, posY, type, seats, xSeats, ySeats, name, seatingType, price);
        });
        // loads a canvas instance from the data store in seat-map.json
        $.getJSON("./seat-map.json", function (data) {
            // console.log("seat-map-maker data load:");
            // console.log(data);

            // loads data to fabric canvas
            fabCanvas.loadFromJSON(data);

            // get the array of fabric objects stored in the canvas object
            var fabGroupObjects = fabCanvas.getObjects();

            // get the max groupID in the array of groups
            fabGroupObjects.forEach(group => {
                var fabObjects = group.getObjects();
                // get first object
                var fabObject = fabObjects[0];
                // check if this objects groupId is greater than the current groupId counter
                if(vm.groupIdCounter < fabObject.groupId){
                    // set groupIdCounter to the new max value
                    vm.groupIdCounter = fabObject.groupId;
                }
            });
            // out put initialized group Id counter value
            // console.log("getJSON-initialized groupId counter: "+vm.groupIdCounter);
        });
    }
});
