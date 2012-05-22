<div>
  <script src="http://mark.obval.com/urbien/lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_msg"></div>
  <div id="lablz_data"></div>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <script type="text/javascript">
<![CDATA[   
      var commentUri;
      var msg = document.getElementById('lablz_msg');
      var div = document.getElementById('lablz_data');
      Lablz.init("466f8d17bdf0cedf16d752b4e2699b76");
      
      var random = ((1 + Math.random()) + '').substring(0, 3);
      var desc = 'I like NY ' + random + ' times as much as yesterday'; 
      
      // comment on my profile
      var where = ["forum=_me","description='" + desc + "'"].join("&");
      var call = "m/Comment?where=" + encodeURIComponent(where);
      msg.innerHTML = msg.innerHTML + "Creating a comment: '" + desc + "' with API call:<br /> " + call;
      Lablz.call(call, "findComment");

      // print the properties of a created resource
      function findComment(json) {
        commentUri = json["_uri"];
        msg.innerHTML = msg.innerHTML + "<br /><br />See the comment here: <a href='" + Lablz.getUrl(commentUri) + "'>" + commentUri + "</a>";
  //      div.innerHTML = div.innerHTML + "<br /><br />We can find the comment easily by its URI: <b>" + commentUri + "</b>, but let's search for it by its description:";
  
        // find comments on myself with a specific title
  //      var where = ["forum=_me","OR(description='" + desc + "'|description=null)"].join("&");
  //      Lablz.call("_me/commentsSubmittedByMe?where=" + encodeURIComponent(where), "Lablz.printJson");
  
        var where = ["forum=_me","description='" + desc + "'"].join("&");
        call = "_me/commentsSubmittedByMe?where=" + encodeURIComponent(where);
        msg.innerHTML = msg.innerHTML + "<br /><br />We can find the comment (via the API) easily by its URI: " + commentUri + ", but let's search for it by its description with the API call: " + call;
        Lablz.call(call, "Lablz.printJson");
  
        desc = "I like NY more each day";
        msg.innerHTML = msg.innerHTML + "<br /><br />Now let's edit it to say: <input type='textbox' id='newText' /><a class='button' href=\"javascript:editComment('" + desc + "');\">Submit</a>";
      }
      
      function editComment() {
        var text = document.getElementById('newText').value;
        var where = ["description='" + text + "'"].join("&");
        call = "e/" + commentUri + "?where=" + encodeURIComponent(where);
        msg.innerHTML = msg.innerHTML + "<br /><br />Edit API call: " + call;
        Lablz.call(call, "lookupAndPrint");
      }

      function lookupAndPrint(json) {
        Lablz.call(json["_uri"], "printProps");
      }
      
      function printProps(json) {
        Lablz.printJson(json, true);
      }
]]>       
  </script>
</div>