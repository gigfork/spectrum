$(document).ready(function () {
    var ourappurl = "http://pupil.iris.pao1.tfoundry.com/phono/index.html?callee=";
    var phonoSessionId = null;
    var call = null;
    var incomingCallFromPSTN = null;
    var incomingCallFromPhono = null;
    
    $(document).bind("phonoReady", function () {
        if (calleePhonoId != null) { //this means the user is visiting our site from a facebook invite to join in a video call
            makeCall(unescape(calleePhonoId));
        } else {    
            // createFacebookUrl(phonoSessionId);
        }
    });
    
    $("#call").click(function () {
        var callee = document.getElementById("callee").value;
        makeCall(callee);
    }); //end call click function
    
    $("#answer").click(function () {
        answerCalls(); 
    });


    $("#hangup").click(function () {
        if (call != null) {
            call.hangup();
        }
        if (incomingCalls.length > 1) {
            var ic = incomingCalls[incomingCalls.length - 1];
            if (ic != null) {
                ic.hangup();
            }
        }
    });

    function answerCalls() {
        if (incomingCallFromPSTN != null && incomingCallFromPhono != null) {
            incomingCallFromPSTN.hangup();
            incomingCallFromPhono.answer();
        } else if (incomingCallFromPSTN != null) {
            incomingCallFromPSTN.answer();
        } else if (incomingCallFromPhono != null) {
            incomingCallFromPhono.answer();
        }
    }

    function makeCall(callee) {
        $("#status").text("Calling " + callee);
        call = phono.phone.dial(callee, {
            tones: true,
            onAnswer: function (event) {
                $("#status").text("Answered");
                $("#remote_label").text("Remote");

                $("#hangup").attr("disabled", false);
                $("#call").attr("disabled", true);
            },
            onHangup: function () {
                $("#status").text("Hangup");
                $("#remote_label").text("");
                call = null;
                $("#call").attr("disabled", false);
                $("#hangup").attr("disabled", true);

            }
        }); // end dial
    } // end make call
    
    
    
    function setupPhono() {
        phono = $.phono({
            apiKey: "C17D167F-09C6-4E4C-A3DD-2025D48BA243",
            gateway: "phono-dev.vipadia.com",
            connectionUrl: "http://ec2-50-19-77-101.compute-1.amazonaws.com:8080/prism_bosh",
            
            onReady: function (event) {
                phonoSessionId = this.sessionId;
                $(document).trigger("phonoReady", this);
                $("#phonoSessionId").text(this.sessionId);
                $("#call").attr("disabled", false);
            },  //end onReady function
            onUnready: function (event) {
                document.getElementById("phonoSessionId").innerHTML = "disconnected";
            }, //end onUnready function
            onError: function (event) {
                document.getElementById("phonoSessionId").innerHTML = event.reason;
            }, //end onError function
           
            audio: {
                localContainerId: "localVideo",
                remoteContainerId: "remoteVideo"
            }, // end audio
            phone: {
                ringTone: "ringtones/Diggztone_Marimba.mp3",
                ringbackTone: "ringtones/ringback-us.mp3",
                onIncomingCall: function (event) {
                    call = event.call;
                    callInitiator = call.initiator;
                    if (RegExp('[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}.*').exec(callInitiator)) {
                        incomingCallFromPhono = call;
                        if (incomingCallFromPSTN != null) { //this means that invited the user for video call so auto answer"
                            answerCalls();
                        }
                    } else {
                        incomingCallFromPSTN = call;
                    }

                    $("#status").text("Incoming call from " + call.initiator);
                    $("#answer").attr("disabled", false);
                    $("#hangup").attr("disabled", false);

                            //Bind events from this call
                    Phono.events.bind(call, {
                        onHangup: function (event) {
                            console.log("Call hungup");
                            $("#answer").attr("disabled", true);
                            $("#hangup").attr("disabled", true);
                        },
                        onError: function (event) {
                            document.getElementById("phonoSessionId").innerHTML = event.reason;
                        }
                    });
                },
                onError: function (event) {
                    document.getElementById("phonoSessionId").innerHTML = event.reason;
                }
            } // end phone section
        }); // end phono initialize  
    } //end setup phono function
    
    setupPhono();

    function createFacebookUrl(phonoSessionId) {
        var appid = '331655900211365';
        //  var to="100003547907631";
        var to = "100003586849571";
        var url = "http://www.facebook.com/dialog/send?app_id=" + appid + "&" +
            "to=" + to + "&" +
            "name=Please join me in a video chat&" +
            "description=DESCRIPTION Please join me in a video chat&" +
            "link=" + ourappurl + phonoSessionId + "&" +
            "redirect_uri=http://pupil.iris.pao1.tfoundry.com/test/close.html";
            //document.getElementById("facebook_link").innerHTML='<a href="'+url+'" target="_blank">'+url+'</a>';
            document.getElementById("facebook_link").innerHTML = '<a href="' + url + '" target="_blank">Invite via facebook</a>';
    }
});
