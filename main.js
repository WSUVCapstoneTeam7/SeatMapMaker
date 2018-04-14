/*jshint esversion: 6 */
const fabCanvas = new fabric.Canvas('c');

fabCanvas.setWidth(window.innerWidth);
fabCanvas.setHeight(window.innerHeight);


fabric.Circle.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            price: this.price,
            groupId: this.groupId,
            seatType: this.seatType,
        });
    };
})(fabric.Circle.prototype.toObject);

fabric.Rect.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            price: this.price,
            rows: this.rows,
            cols: this.cols,
        });
    };
})(fabric.Rect.prototype.toObject);

fabric.Group.prototype.toObject = (function(toObject){
    return function(){
        return fabric.util.object.extend(toObject.call(this),{
            sectionType: this.sectionType,
        });
    };
})(fabric.Group.prototype.toObject);

// a vue bus instance that is used to communicate between 
// vue applications and vue components using signals
// that are defined inside the create methods of each party
// signals are decided upon up front.
var bus = new Vue();

// vue component for the add seating form
Vue.component('add-form',{
    template: '#add-form',
    data() {
        return {
            sectionName: "",
            sectionType: "",
            columns: null,
            rows: null,
            showAddSeatForm: false,
        };
    },
    methods: {
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitSeatingData() {
            console.log("submit seat data");
            console.log(this.sectionType);
            // emit a Make Seating bus signal; or place a passenger on the bus carrying the
            // parameters to make a seating section. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            bus.$emit('sigMakeSeating', 100, 100, this.columns, this.rows, this.sectionName, this.sectionType);

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
            name: "",
            sectionType: "",
            rows: this.rows,
            cols: this.cols,
            posX: this.posX,
            posY: this.posY,
            showEditSeatingForm: false
        };
    },
    methods: {
        submitEditSeating() {
            // console.log(fabCanvas.getActiveObject());
            // console.log(fabCanvas.getActiveObject().calcCoords());
            if (fabCanvas.getActiveObject() != null) {
                var coords = fabCanvas.getActiveObject().calcCoords();
                vm.deleteSeating();
                vm.makeSeating(coords.tl.x, coords.tl.y, this.cols, this.rows, this.name, this.sectionType);
            }
        }
    },
    created() {
        // a bus listener for toggling visibility of the the edit seating form.
        bus.$on('sigEditSeatFormOn', () => {
            this.showEditSeatingForm = true;
        });
        bus.$on('sigEditSeatFormOff', () => {
            this.showEditSeatingForm = false;
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
        downloadStuff() {
            // download a version of the seat map with all the sections grouped.
            // this may be unnecessary if we were somehow able to associate a group property
            // to the objects as well as price. This is a brute force solution.
            this.performDownload("seat-map-maker.json");

            // get the group objects as an array
            const canvasGroupObjects = Array.from(fabCanvas.getObjects());

            // print canvasGroupObjects
            console.log("downloadstuff: canvasGroupObjects");
            console.log(canvasGroupObjects);

            // store the length because it was dynamically changing as items were added to fabCanvas
            console.log("canvasObjects length:"+canvasGroupObjects.length);
            const canvasObjectsLength = canvasGroupObjects.length;

            // an array of arrays to hold the object arrays of each group
            // this an array of the fabric object arrays
            var object_groups_array = [];

            // for each group in the fab canvas
            for (ii = 0; ii < canvasObjectsLength; ii++){
                // store the fabric group 
                var fabricGroup = canvasGroupObjects[ii];

                // print fabric group type, needs to be group and nothing else
                console.log("loadJson-fabricGroupType:");
                console.log(fabricGroup.type);

                // sets items within a group to their local position not group relative
                fabricGroup._restoreObjectsState();

                // get the individual objects from the group
                var groupObjects = fabricGroup.getObjects();
                
                // push the array of objects from group onto the array of group objects
                object_groups_array.push(groupObjects);

                // remove the group from fabric canvas
                fabCanvas.remove(fabricGroup);

                // for each of the groups objects
                // add each of the objects individually into fabcanvas
                // and mark them as dirty so they are refreshed
                for(var jj = 0; jj < groupObjects.length; jj++){
                    groupObjects[jj].dirty = true;
                    fabCanvas.add(groupObjects[jj]);
                }
            }
            // download the seat map viewer map with each object seperated from groups
            this.performDownload("seat-map-viewer.json");
            console.log("afterwards canvasGroupObjects:");
            console.log(canvasGroupObjects);
            
            // removing all objects on the canvas
            fabCanvas.clear();
            
            console.log("after clear fabCanvas:");
            console.log(fabCanvas.getObjects());
            // reapply groups
            object_groups_array.forEach((groupArray=>{
                    var group = new fabric.Group(groupArray, {
                        lockScalingX: true,
                        lockScalingY: true
                    });
                    fabCanvas.add(group);
                }));
            console.log("after re-add groups fabCanvas:");
            console.log(fabCanvas.getObjects());
            fabCanvas.renderAll();    
                

        },
        performDownload(name){
            console.log("download performing on "+ name);
            var fileName = name;
            var jsonString = JSON.stringify(fabCanvas);
            console.log("jsonString:");
            console.log(jsonString);
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
        // END OF NEW STUFF
    }
});

// NEW STUFF
Vue.component('add-general-form',{
    template: '#add-general-form',
    data(){
        return{
            sectionName: "test name",
            sectionColor: "ffffff",
            showAddGenForm: false,
        }
    },
    methods:{
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitGeneralData(){
            console.log("submit seat data");
            // emit a Make Seating bus signal; or place a passenger on the bus carrying the 
            // parameters to make a seating section. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            bus.$emit('sigMakeGeneral',100,100,300,200, this.sectionName, this.sectionColor);

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
        };
    },
    methods:{
        // triggered whenever a button is clicked. emits a sigMakeSeating signal 
        // and passes location 100,100 and the values collected from the input fields
        submitTableData(){
            // emit a Make Table bus signal; or place a passenger on the bus carrying the 
            // parameters to make a table. This package will get off at
            // the bus.$on (bus stop) and get routed to where it should be delivered.
            bus.$emit('sigMakeTable',100,100,this.tableType, this.seats, this.xSeats, this.ySeats, this.sectionName);

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
        })

        // a bus listener for toggling the visibility of both forms when 
        // the delete table signal is received.
        bus.$on('sigAddTableFormOff',()=>{
            this.showAddTableForm = false;
        })
    }, 
})

// NEW STUFF
var vm = new Vue({
    el: '#vue-app',
    data: {
    },
    methods: {
        makeSeating (posX, posY, cols, rows, name, type, price) {
            var rad = 10,
                dia = rad * 2,
                gap = 5,
                sideBuff = 10,
                topBuff = 10,
                bottomBuff = 10,
                sizeX = sideBuff * 2 + cols * dia + (cols - 1) * gap,
                sizeY = topBuff + bottomBuff + rows * dia + (rows - 1) * gap;

            var items = [];

            var container = new fabric.Rect({
                left: posX,
                top: posY,
                originX: 'left',
                originY: 'top',
                stroke: 'black',
                fill: 'transparent',
                width: sizeX,
                height: sizeY,
            });

            var text = new fabric.IText(name, {
                fontSize: 20,
                fontFamily: 'sans-serif',
                left: (posX + (sizeX / 2)),
                top: (posY + 10),
                originX: 'center',
                originY: 'top',
                hasControls: false
            });

            // resize container to accomodate text (maybe just make text box first?)
            container.setHeight(topBuff * 2 + text.height + bottomBuff + rows * dia + (rows - 1) * gap);

            items.push(container);
            items.push(text);
            var color = "";
            if (type == "VSeating")
                color = "green";
            else if (type == "NSeating")
                color = "yellow";
            else if (type == "Standing")
                color = "red";
            for (var i = 0; i < rows; i++) {
                // section_list_item.rows.push(this.GenerateRowListItem(i)); //CNF
                // var row_list_length = section_list_item.rows.length;  //CNF
                // var row_list_item = section_list_item.rows[row_list_length - 1];  //CNF
                for (var j = 0; j < cols; j++) {
                    console.log("adding circle");
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
                    // add price property to circle
                    this.addPriceToObject(circle,price);
                    items.push(circle);
                }
            }
            var group = new fabric.Group(items, {
                lockScalingX: true,
                lockScalingY: true
            });
            // this.seatArray.push(group);
            
            fabCanvas.add(group);
            fabCanvas.renderAll();
            // SEE BELOW LINE: how to attach functions to act on objects given a certain event
            /*	group.on('mousedown', fabricDblClick(group, function (obj) {
                ungroup(group);
                canvas.setActiveObject(text);
                text.enterEditing();
                text.selectAll();
                })); */
            // SEE OLD CODE: "Double-click text editing" for full code

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
                console.log(data);
                this.submitted = true;
            });
        },

// NEW STUFF
        makeGeneral:function(posX, posY, sizeX, sizeY, name, color, price) {

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
    
            items.push(container);
            items.push(text);
            this.addPriceToObject(container, price);
            var group = new fabric.Group(items, {
            lockScalingX: false,
            lockScalingY: false  
            });
            // this.seatArray.push(group);
            
            // add table group to fabric canvas for rendering
            fabCanvas.add(group);
            fabCanvas.renderAll();

            // ungroup objects in group
            var groupItems = []
            var ungroup = function (group) {
                
                console.log("in ungroup()");
                groupItems = group._objects;
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
                var color = container.fill.slice(1);
                var name = text.get('text');
                // remove current objects
                fabCanvas.remove(container);
                fabCanvas.remove(text);
                // create new object
                bus.$emit('sigMakeGeneral', posX, posY, sizeX, sizeY, name, color)
            });

        },
        makeTable:function(posX, posY, type, seats, xSeats, ySeats, name, price) {
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
            stroke: 'black',
            fill: 'transparent',
            width: sizeX,
            height: sizeY,
            });
    
            var text = new fabric.IText(name, {
                fontSize: 20,
                fontFamily: 'sans-serif',
                left: (posX),
                top: (posY + topBuff),
                originX: 'center', 
                originY: 'top',
                hasControls: false  
            });  

            if (type == 'rect') {
/* Need something right here to check if total seats is 2 and make table smaller */

                // calculate height and width of table
                var tableWidth = (2*dia) + (3*gap); // 55 by default
                var tableHeight = tableWidth;       // 55 by default
                if (xSeats >= 2)
                    tableWidth = (xSeats*dia) + ((xSeats+1)*gap);
                if (ySeats >= 2)
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
                            fill: 'green', 
                            left: leftStart + dia*i + gap*i, 
                            top: topPos,
                            originX: 'center',
                            originY: 'center'
                        });
                        var circleB = new fabric.Circle({
                            radius: rad, 
                            fill: 'green', 
                            left: leftStart + dia*i + gap*i, 
                            top: bottomPos,
                            originX: 'center',
                            originY: 'center'
                        });
                        items.push(circleT);
                        items.push(circleB);
                    }
                } // if seats on x axis

                // build chairs along y axis
                if (ySeats > 0) {
                    var topStart = (text.top + text.height + topBuff) + (wholeHeight-tableHeight)/2 + rad;
                    var leftPos = table.left - tableWidth/2 - gap - rad;
                    var rightPos = table.left + tableWidth/2 + gap + rad;
                    for (var i = 0; i < ySeats; i++) {
                        var circleL = new fabric.Circle({
                            radius: rad, 
                            fill: 'green', 
                            left: leftPos,
                            top: topStart + dia*i + gap*i,
                            originX: 'center',
                            originY: 'center'
                        });
                        var circleR = new fabric.Circle({
                            radius: rad,
                            fill: 'green', 
                            left: rightPos,
                            top: topStart + dia*i + gap*i,
                            originX: 'center',
                            originY: 'center'
                        });
                        this.addPriceToObject(circleL, price);
                        this.addPriceToObject(circleR, price);
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
                        fill: 'green', 
                        left: xPos,
                        top: yPos,
                        originX: 'center',
                        originY: 'center'
                    });
                    this.addPriceToObject(circle, price);
                    items.push(circle);
                }
            }

            var group = new fabric.Group(items, {
                lockScalingX: true,
                lockScalingY: true  
            });
            // // this.seatArray.push(group);
            fabCanvas.add(group);
            fabCanvas.renderAll();        
        },
        removePriceGroupElement(group){
            // console.log("removePriceGroupElement: Removing Group");
            // console.log(group);
            for(var ii = 0; ii < this.group_price_array.length; ii++){
                // console.log("removePriceGroupElement: test element");
                // console.log(this.group_price_array[ii]);
                if (this.group_price_array[ii].fabricGroupObject == group){
                    // console.log("Found Element to remove");
                    this.group_price_array.splice(ii,1);
                    // console.log("group_price_array element removed:");
                    // console.log(this.group_price_array);
                }
            }
        },
        addPriceToObject(object, price){
            console.log("addPriceToObject adding: "+price);
            // object.stateProperties.push("price");
            // console.log(object.stateProperties);
            if ((price == undefined||(price<0))){
                price = 999999;
            }
            console.log("addPriceToObject adding: "+price);
            object.price = price;
            
        },
        findPriceInData(dataFabObjects, fabObject){
            var TAG = "findPriceInData-";
            console.log(TAG);
            console.log(dataFabObjects);
            dataFabObjects.forEach((group)=>{
                console.log(TAG+"group:");
                console.log(group);
                group.objects.forEach((object)=>{
                    if(object == fabObject){
                        console.log("object found");
                    }
                });
                
            });
        }
    },
    created() {
        // listens for a signal saying to create a new seating section
        bus.$on('sigMakeSeating', (posX, posY, cols, rows, name, type, price) => {
            // console.log(fabCanvas);
            this.makeSeating(posX, posY, cols, rows, name, type, price);

        });

        // listens for a signal saying to delete the seating
        bus.$on('sigDeleteSeating', () => {
            this.deleteSeating();
        });
// NEW STUFF
        // listens for a signal saying to create a new general section
        bus.$on('sigMakeGeneral', (posX, posY, sizeX, sizeY, name, color)=>{
            this.makeGeneral(posX, posY, sizeX, sizeY, name, color);
        });
        bus.$on('sigMakeTable', (posX, posY, type, seats, xSeats, ySeats, name)=>{
            this.makeTable(posX, posY, type, seats, xSeats, ySeats, name);
        });
// END OF NEW STUFF
        // loads a canvas instance from the data store in seat-map.json
        $.getJSON("./seat-map-maker.json", function (data) {
            console.log("seat-map-maker data load:");
            console.log(data);
            
            const dataFabObjects = data.objects;
            console.log(dataFabObjects);
            // loads fabric data but not price
            fabCanvas.loadFromJSON(data);
            var fabGroupObjects = fabCanvas.getObjects();
        //     fabGroupObjects.forEach((group)=>{
        //         console.log("getJSon new group");
        //         console.log("getJson group length");
        //         console.log(group.getObjects().length);
        //         var GeneralAreaException = {};
        //         try{
        //             group.getObjects().forEach((fabObject)=>{
        //                 if(group.getObjects().length == 2){
        //                     console.log("this is a general area");
        //                     if(fabObject.type === "rect"){
        //                         console.log("This is the General Area rect");
        //                         // breaks out of forEach with exception throw
        //                         GeneralAreaException = fabObject;
        //                         throw GeneralAreaException;
        //                     }
        //                 }
        //             console.log("getJson fabObject type:");
        //             console.log(fabObject.type);
        //             console.log("getJson fabObject fill:");
        //             console.log(fabObject.fill);
        //         });
        //     }catch(e){
        //         if (e !== GeneralAreaException){
        //             throw e;
        //         }
        //         console.log("GeneralArea Exception");
        //         var price = vm.findPriceInData(dataFabObjects, e);
        //         // this.addPriceToObject(e, price);
        //     }}
        // );
        });
    }
});
