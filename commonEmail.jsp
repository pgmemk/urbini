<div id="textdiv3" class="popMenu" pda="T"> 
<table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<div style="border-style:solid; border-width: 1px; border-color:#666666 #666666 #666666 #666666">
<div style="border-style:solid; border-width: 1px; border-color:#F9F8F7 #F9F8F7 #F9F8F7 #F9F8F7">
<table border="0" cellpadding="0" cellspacing="0">
<tr>
  <td unselectable="on" bgcolor="#003070" class="cswmItem" style="padding-left:3" colspan="2">
    <b><font color="FFFFFF">E-mail</font></b>
  </td>
  <td unselectable="on" bgcolor="#003070" style="padding-right:3; padding-top:3; padding-bottom:3">
    <A title="Close" onclick="menuOpenClose('textdiv3')" 
       href="javascript://"><IMG alt="Click here to close" 
       src="images/button_popup_close.gif" 
       border="0" style="display:block"></IMG>
    </A>
  </td>
</tr>
<tr>
  <td bgcolor="#DBD8D1" width="15" class="cswmItem"></td>
  <td bgcolor="#FFFFFF">

  <form name="emailForm" action="page2email" method="GET">
    <table cellpadding="5">
      <tr nonPda="T"> 
        <td><b><text text="E-mail:"/></b></td>
      </tr>
      <tr> 
        <td> <table border="0" cellspacing="2" cellpadding="3">
            <tr> 
              <td bgcolor="#e3e2df" class="cswmItem"><b>Subject:</b></td>
              <td bgcolor="#e3e2df"><input name="subject"></input>
                </td>
            </tr>
            <tr> 
              <td bgcolor="#e3e2df" class="cswmItem"><b>E-mail:</b></td>
              <td bgcolor="#e3e2df"><input name="to"></input>
                </td>
            </tr>
            <tr> 
              <td bgcolor="#e3e2df" class="cswmItem"><b>Format:</b></td>
              <td bgcolor="#e3e2df"> <select name="format" onchange="onRecChange()">
                  <option value="html">HTML</option>
                  <option value="xls">Excel</option>
                </select> </td>
            </tr>
          </table></td>
      </tr>
      <tr>
        <td><input type="submit" value="Send"></input>
        </td>
      </tr>
    </table>
  </form>
</td><td bgcolor="#FFFFFF"></td></tr>
</table>
</div></div>
</td></tr>
  </table>
</div>
