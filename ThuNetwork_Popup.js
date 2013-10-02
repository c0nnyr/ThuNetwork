var LoginLogoutURL = 'https://usereg.tsinghua.edu.cn/do.php';
var UserInfoURL = 'https://usereg.tsinghua.edu.cn/user_info.php';
var OnlineStatusURL = 'https://usereg.tsinghua.edu.cn/online_user_ipv4.php';
var OnlineNumURL = 'https://usereg.tsinghua.edu.cn/modify_online_num.php';
var IPSelfLoginURL = 'http://net.tsinghua.edu.cn/cgi-bin/do_login';
var IPLoginURL = 'http://166.111.8.120/cgi-bin/do_login';
var HistoryURL = 'https://usereg.tsinghua.edu.cn/user_detail_list.php' ;
var WhereIsMyIP = 'http://www.whereismyip.com/'

var total_in_traffic_online = 0;
var total_in_traffic_offline = 0;
var my_ip = '';
// Ψһ��ȱ������Login���漸����Ҫ�������첽�ģ���������ȷ��Ҫ����ġ�
function getCookie(c_name)
{
if (document.cookie.length>0)
  {
  c_start=document.cookie.indexOf(c_name + "=")
  if (c_start!=-1)
    { 
    c_start=c_start + c_name.length+1 
    c_end=document.cookie.indexOf(";",c_start)
    if (c_end==-1) c_end=document.cookie.length
    return unescape(document.cookie.substring(c_start,c_end))
    } 
  }
return ""
}

function setCookie(c_name,value)
{
	var expiredays = 30;
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name+ "=" +escape(value)+
	((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
}
function TransformTrafficStringToGB(traffic_text)
{
	var unit = traffic_text[traffic_text.length - 1];
	var number_str = traffic_text.substring(0, traffic_text.length - 1);
	var weight = 0;
	if (unit == 'B')
		weight = 1.0 / 1000.0 / 1000.0 / 1000.0;
	else if (unit == 'K')
		weight = 1.0 / 1000.0 / 1000.0;
	else if (unit == 'M')
		weight = 1.0 / 1000.0;
	else if (unit == 'G')
		weight = 1.0;
	else
		weight = 1000.0;
	return Number(number_str) * weight;    
}
function Drop(ip, param)
{
	return function(){//Ư��
	var url_data = "action=drop&user_ip="+ip+"&checksum="+param;
	$.post(OnlineStatusURL, url_data, function(data){
	if (data == 'ok')
		document.getElementById(ip).innerHTML = '���߳ɹ�';
	else
		alert(data);
	//����ˢ��
	GetMyIP();
	Crawl_online_user_ipv4();
	});
	};
	
}
function Sleep(n)
 { 
	var start = new Date().getTime(); 
	while(true) 
		if(new Date().getTime()-start > n)
			break; 
}
function GetMyIP()
{
	$.get(WhereIsMyIP, null, function(data){
		my_ip = $(data).find('font')[0].innerHTML;
		if (document.getElementById(my_ip) != null)
			document.getElementById(my_ip).innerHTML += '(me)';
		//��ȫ������������������������������
	});
}
function Crawl_online_user_ipv4()
{
	$.get(OnlineStatusURL, null, function(data){
	var trs = $(data).find('tr');

	$('tbody').replaceWith('<tbody></tbody>');
	for (var i = 3; i < trs.length; i++)
	{
		var tds = $(trs[i]).find('td');
		//var user = tds[1].innerHTML;
		var ip = tds[2].innerHTML;
		var ip_node = '<strong id="' + ip + '">' + ip + '</strong>';
		var in_traffic = tds[3].innerHTML;
		//var on_line_datetime = tds[8].innerHTML;
		var off_line_param = $(tds[11].innerHTML).attr('onclick').split("'")[3];// ��ΪChrome�Ĳ����֧��inline_script��Ҳ�������Ƿ�����Ϊ�ͱ��֣���������ȡ��������̬��ӷ���
		var off_line = '<input type="button" id="' + i + '"  value="����" />';
		var wrapper = ['<td class="maintd">','</td>'];
		var tr = '<tr align="center">' + [/*wrapper.join(user), */wrapper.join(ip_node), wrapper.join(in_traffic), 
			/*wrapper.join(on_line_datetime), */wrapper.join(off_line)].join('') + '</tr>';
		$('tbody').append(tr);
		total_in_traffic_online += TransformTrafficStringToGB(in_traffic);
		document.getElementById(String(i)).onclick = Drop(ip, off_line_param);
	}
	});
}

function Crawl_user_info()
{
	$.get(UserInfoURL, null, function(data){
	var traffic_str = $(data).find('.maintd')[29].innerHTML;
	var traffic_text = traffic_str.substring(0, traffic_str.indexOf('(')) + 'B';
	total_in_traffic_offline = TransformTrafficStringToGB(traffic_text);
	//alert(traffic);
	var total = total_in_traffic_offline + total_in_traffic_online;//��ȫ��������������������
	var day = (new Date()).getDate();
	var class_type = 'traffic_normal';
	if (total > 20.0 / 30 * day)
		class_type = 'traffic_nerves';
	$('body').append('<span class="' + class_type + '">��������' + total.toFixed(4) + 'G</span>');
	});
}

function Login(user, password)
{
	var url_data = $.param({'action':'login', 'user_login_name':user, 'user_password':password});
	$.post(LoginLogoutURL, url_data, function(data){
		//alert(data); // assert(ok)
		if (data == 'ok')
		{
			GetMyIP();
			Crawl_online_user_ipv4();
			Crawl_user_info();
		}
		else
		{
			alert(data);
		}
	});
}

var has_password_changed = false;
$(document).ready(function(){
$.post(IPSelfLoginURL, "action=check_online", function(data) {
	if (data =='')
	{
		$('body').append('<div>�û�<input type="text" name="user" id="user"/><br/>����<input type="password" name="password" id="password"/><br/><input type="button" value="����" id="online" /></div>');
		$('body').append('<table><tbody></tbody></table>');
		document.getElementById('online').onclick = function(){
			var password = document.getElementById('password').value;
			var user = document.getElementById('user').value;
			if(user == '' || password == '')
			{
				alert('Form must be filled');
				return;
			}
			var md5_password = password;
			if (has_password_changed)
				md5_password = hex_md5(password);

			var url_data = "username=" + user + "&password=" + md5_password +
			"&drop=0&type=1&n=100";
			$.post(IPSelfLoginURL,url_data, function(data){
				if (!isNaN(data[0]))//��½�ɹ����ص�����
				{
					//$('div').replaceWith('��½�ɹ�');
					setCookie('user', user);
					setCookie('md5_password', md5_password);
					$('div').replaceWith('��½�ɹ�');
					Login(user, md5_password);
				}
				else if(data == 'online_num_error')
				{
					setCookie('user', user);
					setCookie('md5_password', md5_password);
					$('div').replaceWith('��Ͽ�����Ҫ������');
					Login(user, md5_password);
				}
				else if(data == 'username_error' || (data.indexOf('password_error') != -1))
				{
					alert('�û��������������');
					//window.close();
				}
				else
				{
					alert(data);
					//window.close();
				}
				});
			};
		
		document.onkeydown = function(){
			if(event.keyCode == 13)
				document.getElementById('online').onclick();
		};
		var user = getCookie('user');
		var md5_password = getCookie('md5_password');
		document.getElementById('user').value = user;
		document.getElementById('password').value = md5_password;
		document.getElementById('password').onchange = function(){
			has_password_changed = true;
		};
	}
	else
	{
		var user = getCookie('user');
		if (user == '')
		{
			alert('���ȶ�����������ȷ���û��������������ӣ���ȡ������Ϣ');
			window.colse();
			return;
		}
		var md5_password = getCookie('md5_password');
		
		$('body').append('<div>IP<input type="text" name="ip" id="ip"/><input type="button" value="����" id="online" /></div>');
		$('body').append('<table><tbody></tbody></table>');
		Login(user, md5_password);

		document.getElementById('online').onclick = function(){
			var ip = document.getElementById('ip').value;
			var reg_ip = /^(([01]?[\d]{1,2})|(2[0-4][\d])|(25[0-5]))(\.(([01]?[\d]{1,2})|(2[0-4][\d])|(25[0-5]))){3}$/;
			if(!reg_ip.test(ip))
			{
				document.getElementById('ip').value = '';
				return;
			}
			var url_data = "n=100&is_pad=1&type=10&username="+user+"&password="+md5_password+"&user_ip="+ip+"&drop=0";
			$.post(IPLoginURL, url_data, function(data){
				if (data.indexOf("���ӳɹ�") != -1)//��½�ɹ����ص����� �������������Ȼ���ܼ�ʱ���У������������ˡ�~~~
				{
					$('div').replaceWith('<div>IP<input type="text" name="ip" id="ip"/><input type="button" value="����" id="online" />��½�ɹ�</div>')
					GetMyIP();
					Crawl_online_user_ipv4();
				}
				else
				{
					alert(data);
				}
			});
		}
	}
});});
//$.ajaxStop(function(){
//	alert('�������� ' + String(total_in_traffic_online + //total_in_traffic_offline ));
//});

