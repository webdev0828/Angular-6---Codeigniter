<?php
require(APPPATH . '/libraries/REST_Controller.php');


class Api extends REST_Controller
{

	public function __construct($config = 'rest')
	{
		header('Access-Control-Allow-Origin: *');
		header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
		parent::__construct();
		$this->load->database();
	}

	/**
	 * A user can login if he presents a valid password and is "activated" by the administrator.
	 * Administrators can always login with a valid password.
	 */
	public function login_post()
	{
		$userEmail = $this->post("email");
		$userPassword = sha1($this->post("password"));
		$currentDate = date("Y-m H:i:s");

		//Check the user in database to be active
		$user = $this->db->query("select * from user where email = '$userEmail'")->row();

		if ($user) {
			if ($user->status == 'disable') {
				//$msg = "User is disabled. Please contact administrator.";
				$msg = "Brugeren har ikke adgang. Kontakt solfilm.dk for at få adgang.";

				$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			$user = $this->db->query("select * from user where email = '$userEmail' and password = '$userPassword' and status = 'active'")->row();

			if ($user) {
				$customerId = $user->customerId;

				if ($customerId == '0' && $user->administrator == '1') {
					$orderedByName = "";
				} else {
					$orderedByName = $user->name;
				}

				$ch = curl_init();

				$resourceUrl = "customer/" . $customerId;
				$url = $this->baseUrl . $resourceUrl;

				curl_setopt($ch, CURLOPT_URL, $url);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

				$headers = getRestApiHeaders();
				curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

				$result = curl_exec($ch);
				if (curl_errno($ch)) {
					$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}
				if ($result == "[]") {
					//$msg = "User not found in MobilPlan Database";
					$msg = "Brugeren blev ikke fundet i MobilPlan";

					$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}
				curl_close($ch);

				$checkInstallers = $this->db->query("select * from installers where autoDealerId = '$customerId'")->result_array();
				$data = array();
				$data['data'] = $user;
				$tokenData = array();
				$tokenData['email'] = $user->email;
				$tokenData['userId'] = $user->userId;
				$tokenData['date'] = $currentDate;

				$authToken = AUTHORIZATION::generateToken($tokenData);

				if ($user->status == 'disable') {
					//$msg = "User is disabled. Please contact administrator.";
					$msg = "Brugeren har ikke adgang. Kontakt solfilm.dk for at få adgang.";

					$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}

				$this->response(array("status" => "success", "data" => $user, "orderedByName" => $orderedByName, "installers" => count($checkInstallers),
					"email" => $user->email, "passwordChanged" => $user->passwordChanged, "token" => $authToken, "request_status" => REST_Controller::HTTP_OK));

			} else {
				//$msg = "Invalid email/password";
				$msg = "Ugyldig email eller adgangskode";

				$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}
		} else {
			//$msg = "This user does not exist in our records";
			$msg = "Brugeren er ukendt. Kontrollér venligst mail adressen eller kontakt solfilm.dk for at få adgang.";
			$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
	}

	/**
	 * Performs the actual update of the user password
	 */
	public function passwordReset_post()
	{
		$email = $this->post("email");
		$password = sha1($this->post("password"));
		$token = $this->post("token");
		$checkToken = $this->checkToken($token);

		if ($checkToken) {
			$checkUser = $this->db->query("select * from user where email = '$email'")->row();

			if ($checkUser) {
				$data = array();
				$data['password'] = $password;
				$data['passwordChanged'] = "yes";

				$this->db->update("user", $data, array("email" => $email));
				$checkUser = $this->db->query("select * from user where email = '$email'")->row();

				if ($checkUser->customerId == '0' && $checkUser->administrator == '1') {
					$orderedByName = "";
				} else {
					$orderedByName = $checkUser->name;
				}

				$checkInstallers = $this->db->query("select * from installers where autoDealerId = '$checkUser->customerId'")->result_array();
				//$msg = "Password changed successfully.";
				$msg = "Adgangskoden er ændret";

				$this->response(array("status" => "success", "data" => $checkUser, "orderedByName" => $orderedByName, "message" => $msg, "installers" => count($checkInstallers), "request_status" => REST_Controller::HTTP_OK));
			}
		} else {
			$this->response(array("status" => "failed", "message" => "Unauthorized", "request_status" => REST_Controller::HTTP_UNAUTHORIZED));
		}
	}

	public function checkToken($token)
	{
		$decodedToken = AUTHORIZATION::validateToken($token);
		if ($decodedToken != false) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Activates/deactivates an user/customer contact/salesman
	 * If the user is activated for the first time a welcome email is sent to him.
	 */
	public function addUser_post()
	{
		$email = $this->post("email");
		$status = $this->post("status");
		$mobilPlanId = $this->post("mobilPlanId");
		$customerId = $this->post("customerId");
		$name = $this->post("name");
		$checkUser = $this->db->query("select * from user where email = '$email'")->row();

		if ($checkUser) {
			$data = array();
			$data['status'] = $status;
			$this->db->update("user", $data, array("email" => $email));
			$mobilPlanId = $checkUser->mobilPlanId;
			$user = $this->db->query("select * from user where mobilPlanId = '$mobilPlanId' and administrator ='0'")->row();

			if ($status == "active") {
				//$msg = "Status has been changed to active for ";
				$msg = "Adgangen er åbnet for  ";
				$this->response(array("status" => "success", "type" => "active", "data" => $msg . $email, "user" => $user, "request_status" => REST_Controller::HTTP_OK));
			} else if ($status == "disable") {
				//$msg = "Status has been changed to disabled for ";
				$msg = "Adgangen er lukket for ";
				$this->response(array("status" => "success", "type" => "disable", "data" => $msg . $email, "user" => $user, "request_status" => REST_Controller::HTTP_OK));
			}
		} else {
			$data = array();
			$data['mobilPlanId'] = $mobilPlanId;
			$data['customerId'] = $customerId;
			$data['name'] = $name;
			$data['email'] = $email;
			$data['password'] = sha1("user1234");
			$data['originalPassword'] = "user1234";
			$data['status'] = "active";
			$data['passwordChanged'] = "no";
			$data['type'] = "autodealer";
			$this->db->insert("user", $data);

			// insert auto dealer with reference to customerId, if not exists
			$insert_id = $this->db->insert_id();
			$autodealer = array();
			$autodealer['mobilPlanId'] = $customerId; // this does not make sense
			//$autodealer['mobilPlanId'] = $insert_id;
			$checkAutoDealer = $this->db->query("select * from autodealers where mobilPlanId = '$customerId'")->row();
			if(!$checkAutoDealer) {
				// does not exist, create
				$this->db->insert("autodealers", $autodealer);
			}

			$checkUser = $this->db->query("select * from user where customerId = '$customerId' and administrator !='1'")->row();
			$from = getenv('MAIL_FROM_ADDRESS');
			$from_name = getenv('MAIL_FROM_NAME');
			$envSendToRealEmailAddresses = getenv('SEND_TO_REAL_EMAIL_ADDRESSES');

			if ($envSendToRealEmailAddresses === 'true') {
				$to = $email;
			} else {
				$to = getenv('MAIL_FROM_ADDRESS');
			}
			$subject = 'LOGIN INFORMATION';

			$email_data = array();
			$email_data['email'] = $email;
			$email_data['password'] = "user1234";
			$email_data['name'] = $name;
			$email_data['link'] = getenv("PANEL_URL") . 'login';

			$message = $this->load->view('email_template', $email_data, true);

			$this->smtp_email->send($from, $from_name, $to, $subject, $message);

			//$msg = "Access has been granted to ";
			$msg = "Der er åbnet for adgang og afsendt velkomst-mail til ";


			$this->response(array("status" => "success", "type" => "active", "data" => $msg . $email, "user" => $checkUser,
				"request_status" => REST_Controller::HTTP_OK));
		}
	}

	public function autoDealer_get()
	{
		$autoDealerId = $this->get("customerId");

		/*
		 * Get customer by customerId (autoDealerId) example response:
		 *
		 * [
			  {
				"id": "2979",
				"custom_branche": "",
				"custom_privat": "",
				"custom_tester": "",
				"custom_fax": "",
				"custom_skillness": "",
				"name": "Østjysk Skilte ApS",
				"guid": "",
				"customer_no": "100378",
				"email": "nick@oestjyskskilte.dk",
				"address_street": "Østergårdsvej 19 ",
				"address_zip": "8464",
				"address_city": "Galten",
				"phone": "30222938",
				"note": "",
				"foreign_key": "",
				"_customer_group": "8",
				"created_by": "9",
				"created_on": "2019-02-25 08:37:02",
				"updated_by": "24",
				"updated_on": "2019-08-17 20:18:01",
				"deleted": "0",
				"deleted_by": "0",
				"deleted_on": "0000-00-00 00:00:00"
			  }
			]
		 *
		 *
		 */
		$ch2 = curl_init();
		$resourceUrl = "/customer/" . $autoDealerId;
		$url = $this->baseUrl . $resourceUrl;

		curl_setopt($ch2, CURLOPT_URL, $url);
		curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch2, CURLOPT_CUSTOMREQUEST, "GET");
		$headers = getRestApiHeaders();
		curl_setopt($ch2, CURLOPT_HTTPHEADER, $headers);

		$customersJsonResponse = curl_exec($ch2);
		$customers = json_decode($customersJsonResponse, true);

		if (curl_errno($ch2)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch2), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}

		curl_close($ch2);

		// return the employee list and user list
		$this->response(array("status" => "success", "customerList" => $customers, "request_status" => REST_Controller::HTTP_OK));
	}

	/**
	 * Used to get a list of the autodealers users.
	 * The list will contain the primary contact details as email address, as a autodealer user and all the autodealer's
	 * contact persons (also know as sales man)
	 * The list of all users are fetched from MobilPlan REST API and combined with the users which have been
	 * activated throug the Order System.
	 *
	 * Only the administrator can activate/deactivate user through the administration interface.
	 */
	public function usersAndAssignedEmployees_get()
	{
		$autoDealerId = $this->get("customerId");
		/*
		 * Get customer contacts by autoDealerId
		 *
		 *  ...
		 * 	  {
				"id": "837",
				"ref_id": "2979",
				"contact_type": "customer",
				"customer_id": "0",
				"email": "nick@oestjyskskilte.dk",
				"name": "Nick",
				"phone": "112",
				"occupation": "",
				"notes": "",
				"sort_on": "3",
				"created_by": "24",
				"created_on": "2019-08-28 19:36:14",
				"updated_by": "24",
				"updated_on": "2019-08-28 19:36:14",
				"deleted": "0",
				"deleted_by": "0",
				"deleted_on": "0000-00-00 00:00:00"
			  }
			]
		 *
		 *
		 */
		$ch1 = curl_init();
		$resourceUrl = "/customer-contacts/customer/" . $autoDealerId;
		$url = $this->baseUrl . $resourceUrl;

		curl_setopt($ch1, CURLOPT_URL, $url);
		curl_setopt($ch1, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch1, CURLOPT_CUSTOMREQUEST, "GET");

		$headers = getRestApiHeaders();

		curl_setopt($ch1, CURLOPT_HTTPHEADER, $headers);

		$customerContactsJsonResponse = curl_exec($ch1);
		$customerContacts = json_decode($customerContactsJsonResponse, true);

		if (curl_errno($ch1)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch1), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}

		curl_close($ch1);

		// match found customerContacts with users in local database to set flags indicating whether or not the
		// customer contacts was activated.
		$userList = array();
		for ($x = 0; $x < count($customerContacts); $x++) {
			$userEmail = $customerContacts[$x]['email'];
			$checkUser = $this->db->query("select * from user where email = '$userEmail'")->row();
			if ($checkUser) {
				if ($checkUser->status == "active" || $checkUser->status == "disable") {
					$userList[$x] = $customerContacts[$x];
					$userList[$x]['already'] = "yes";
					$userList[$x]['status'] = $checkUser->status;
				}

				// not user found matching the customerContact by email
			} else {
				$userList[$x] = $customerContacts[$x];
				$userList[$x]['already'] = "no";
				$userList[$x]['status'] = "disable";
			}
		}

		$checkUser = $this->db->query("select * from user where customerId = '$autoDealerId'")->row();

		// we fetch assigned installers, customer contacts if there was a user found in database.
		$employeeList = array();

		if ($checkUser) {
			$getAllEmployees = $this->db->query("select * from employees")->result_array();
			$employeeList = array();

			for ($a = 0; $a < count($getAllEmployees); $a++) {
				$empId = $getAllEmployees[$a]['employeeId'];
				$checkAssignedInstaller = $this->db->query("select * from installers where mobilPlanId = '$empId' and autoDealerId = '$autoDealerId'")->row();

				if ($checkAssignedInstaller) {
					$employeeList[$a] = $getAllEmployees[$a];
					$employeeList[$a]['assigned'] = "yes";
				} else {
					$employeeList[$a] = $getAllEmployees[$a];
					$employeeList[$a]['assigned'] = "no";
				}
			}

			// sort users by name
			usort($userList, function ($a, $b) {
				return strcmp($a['name'], $b['name']);
			});

			// return the employee list and user list
			$this->response(array("status" => "success", "employeeList" => $employeeList, "userList" => $userList, "request_status" => REST_Controller::HTTP_OK));

		}
		// return the employee list and user list
		$this->response(array("status" => "success", "employeeList" => $employeeList, "userList" => $userList, "request_status" => REST_Controller::HTTP_OK));
	}

	/**
	 * Used for assigning an employee as a primary "installer" ti a given autodealer. All other employees (in Local Database) are secondary.
	 */
	public function assignEmployee_post()
	{
		$status = $this->post("status");
		$mobilPlanId = $this->post("mobilPlanId");
		$customerId = $this->post("customerId");
		$email = $this->post("email");
		$empName = $this->post("empName");
		$cName = $this->post("cName");
		$checkCustomer = $this->db->query("select * from user where customerId = '$customerId'")->row();

		if ($checkCustomer) {
			if ($status == "assign") {
				$data = array();
				$data['mobilPlanId'] = $mobilPlanId;
				$data['autoDealerId'] = $customerId;
				$this->db->insert("installers", $data);

				$getAllEmployees = $this->db->query("select * from employees")->result_array();
				$assignedEmployees = array();

				for ($a = 0; $a < count($getAllEmployees); $a++) {
					$employeeId = $getAllEmployees[$a]['employeeId'];
					$checkInstaller = $this->db->query("select * from installers where autoDealerId = '$customerId' and mobilPlanId = '$employeeId'")->row();

					if ($checkInstaller) {
						$assignedEmployees[$a] = $getAllEmployees[$a];
						$assignedEmployees[$a]['assigned'] = "yes";
					} else {
						$assignedEmployees[$a] = $getAllEmployees[$a];
						$assignedEmployees[$a]['assigned'] = "no";
					}
				}

				$this->response(array("status" => "success", "data" => $assignedEmployees, "message" => $empName . " tildelt til " . $cName, "request_status" => REST_Controller::HTTP_OK));

			} else {
				$where = "mobilPlanId = " . $mobilPlanId . " and autoDealerId = " . $customerId;
				$this->db->delete("installers", $where);

				$assignedEmployees = array();
				$getAllEmployees = $this->db->query("select * from employees")->result_array();

				for ($a = 0; $a < count($getAllEmployees); $a++) {
					$employeeId = $getAllEmployees[$a]['employeeId'];

					$checkInstaller = $this->db->query("select * from installers where autoDealerId = '$customerId' and mobilPlanId = '$employeeId'")->row();
					if ($checkInstaller) {
						$assignedEmployees[$a] = $getAllEmployees[$a];
						$assignedEmployees[$a]['assigned'] = "yes";
					} else {
						$assignedEmployees[$a] = $getAllEmployees[$a];
						$assignedEmployees[$a]['assigned'] = "no";
					}
				}
				$this->response(array("status" => "success", "data" => $assignedEmployees, "message" => $empName . " fjernet fra " . $cName, "request_status" => REST_Controller::HTTP_OK));
			}
		} else {
			$this->response(array("status" => "failed", "data" => "Could not assign employee to autodealer. Does the employee exist in MobilPlan", "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
	}

	/**
	 * An Nordisk Solfilm employee can work as administrator with more priviledges. The administrator can login in
	 * behalf on any autodealer and his users to submit and cancel orders.
	 */
	public function simulateUser_post()
	{
		$email = $this->post("email");
		$currentDate = date("Y-m H:i:s");
		$checkUser = $this->db->query("select * from user where email = '$email'")->row();

		if ($checkUser) {
			if ($checkUser->status == "active") {
				$customerId = $checkUser->customerId;
				$user = $this->db->query("select * from user where customerId = '$customerId' and administrator !='1'")->row();
				$checkInstallers = $this->db->query("select * from installers where autoDealerId = '$customerId'")->result_array();

				$data = array();
				$data['data'] = $checkUser;
				$tokenData = array();
				$tokenData['email'] = $email;
				$tokenData['userId'] = $checkUser->userId;
				$tokenData['date'] = $currentDate;

				$authToken = AUTHORIZATION::generateToken($tokenData);
				$this->response(array("status" => "success", "data" => $checkUser, "user" => $user, "installers" => count($checkInstallers), "token" => $authToken,
					"request_status" => REST_Controller::HTTP_OK));
			} else {
				//$msg = "Activate this user to login into their account.";
				$msg = "Giv brugeren adgang før du kan logge ind på vegne af denne.";
				$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_OK));
			}
		} else {
			//$msg = "Access has not been granted to this user yet.";
			$msg = "Giv brugeren adgang før du kan logge ind på vegne af denne.";
			$this->response(array("status" => "failed", "data" => $msg, "request_status" => REST_Controller::HTTP_OK));
		}
	}

	/**
	 * TODO documentation must be elaborated
	 */
	public function addEmployee_post()
	{
		$status = $this->post("status");
		$empId = $this->post("empId");
		$email = $this->post("email");
		$fname = $this->post("fname");
		$lname = $this->post("lname");
		if ($status == "add") {
			$data = array();
			$data['employeeId'] = $empId;
			$data['employeeEmail'] = $email;
			$data['firstname'] = $fname;
			$data['lastname'] = $lname;
			$this->db->insert("employees", $data);

			$ch = curl_init();

			$resourceUrl = "/employees";
			$url = $this->baseUrl . $resourceUrl;

			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");


			$headers = getRestApiHeaders();

			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

			$result = curl_exec($ch);

			$final_result = json_decode($result, true);

			$storedEmployees = array();
			for ($a = 0; $a < count($final_result); $a++) {
				$id = $final_result[$a]['id'];
				$checkEmployee = $this->db->query("select * from employees where employeeId = '$id'")->row();
				if ($checkEmployee) {
					$storedEmployees[$a] = $final_result[$a];
					$storedEmployees[$a]['already'] = "yes";
				} else {
					$storedEmployees[$a] = $final_result[$a];
					$storedEmployees[$a]['already'] = "no";
				}
			}

			if (curl_errno($ch)) {
				$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			$this->response(array("status" => "success", "data" => $storedEmployees, "request_status" => REST_Controller::HTTP_OK));
			curl_close($ch);

		} else {
			$where = "employeeId = " . $empId;
			$this->db->delete("employees", $where);
			$ch = curl_init();

			$resourceUrl = "/employees";
			$url = $this->baseUrl . $resourceUrl;

			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");


			$headers = getRestApiHeaders();

			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

			$result = curl_exec($ch);

			$final_result = json_decode($result, true);

			$storedEmployees = array();
			for ($a = 0; $a < count($final_result); $a++) {
				$id = $final_result[$a]['id'];
				$checkEmployee = $this->db->query("select * from employees where employeeId = '$id'")->row();
				if ($checkEmployee) {
					$storedEmployees[$a] = $final_result[$a];
					$storedEmployees[$a]['already'] = "yes";
				} else {
					$storedEmployees[$a] = $final_result[$a];
					$storedEmployees[$a]['already'] = "no";
				}
			}

			if (curl_errno($ch)) {
				$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			$this->response(array("status" => "success", "data" => $storedEmployees, "request_status" => REST_Controller::HTTP_OK));
			curl_close($ch);

		}
	}

	/**
	 * Get all employess from MobilPlan REST API.
	 * Some of the employees can be selected to work as window tint installers
	 *
	 * Note: This is not the same as "assigned installers"
	 */
	public function SavedEmployees_get()
	{
		$getAllEmployees = $this->db->query("select * from employees")->result_array();

		foreach ($getAllEmployees as $user) {
			if ($user) {
				$mobilPlanId = $user['employeeId'];
				$ch1 = curl_init();

				$resourceUrl = "/employee/" . $mobilPlanId;
				$url = $this->baseUrl . $resourceUrl;

				curl_setopt($ch1, CURLOPT_URL, $url);
				curl_setopt($ch1, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch1, CURLOPT_CUSTOMREQUEST, "GET");

				$headers = getRestApiHeaders();

				curl_setopt($ch1, CURLOPT_HTTPHEADER, $headers);

				$result = curl_exec($ch1);
				if (curl_errno($ch1)) {
					//	$this->response(array("status" => "failed", "data" => curl_error($ch1), "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}
				if ($result == "[]") {
					$this->db->delete('employees', array('employeeId' => $mobilPlanId));
				}
				curl_close($ch1);
			}
		}
		$getAll = $this->db->query("select * from employees")->result_array();
		$this->response(array("status" => "success", "data" => $getAll, "request_status" => REST_Controller::HTTP_OK));
	}


	/**
	 * An autodealer user can cancel their order.
	 * This is done through the Booking Calendar REST API with orderId as argument
	 */
	public function cancelOrder_post()
	{
		$orderId = $this->post("orderId");
		$baseUrl = getenv("REST_SERVICE_URL");
		$url = $baseUrl . '/order?orderId=' . $orderId;

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");

		$headers = array(
			'Content-Type:  application/json;charset=UTF-8'
		);

		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

		curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);
		$this->response(array("status" => "success", "request_status" => REST_Controller::HTTP_OK));
	}

	/**
	 * Used for sending a "forgotten password email". The email will contain a hashed email
	 * which can be used for resetting the password.
	 */
	public function forgetPassword_post()
	{
		$email = $this->post("email");
		$date = $this->post("date");
		$checkEmail = $this->db->query("select * from user where email = '$email'")->row();

		if ($checkEmail) {
			$token = array();
			$token['passwordResetToken'] = md5($email);
			$token['passwordReset'] = 'no';
			$token['passwordResetDate'] = $date;
			$this->db->update("user", $token, array("userId" => $checkEmail->userId));

			$rowData = $this->db->query("select * from settings where Id='1'")->row();
			$from = $rowData->email;
			$subject = 'GLEMT DIN ADGANGSKODE?';
			$from_name = getenv('MAIL_FROM_NAME');

			// check if the email is going to be sent to the customers real email address
			$envSendToRealEmailAddresses = getenv('SEND_TO_REAL_EMAIL_ADDRESSES');

			if ($envSendToRealEmailAddresses === 'true') {
				$to = $email;
			} else {
				// take the sender's 'from' address as destination address
				$to = getenv('MAIL_FROM_ADDRESS');
			}

			$email_data = array();
			$email_data['link'] = getenv("PANEL_URL") . "forget/" . $email . '/' . md5($email);
			$email_data['name'] = $checkEmail->name;

			$message = $this->load->view('password', $email_data, true);
			$this->smtp_email->send($from, $from_name, $to, $subject, $message);

			$this->response(array("status" => "success"));
		} else {
			$this->response(array("status" => "failed"));
		}
	}

	public function checkEmail_post()
	{
		$email = $this->post("email");
		$checkEmail = $this->db->query("select * from user where email = '$email'")->row();
		if ($checkEmail) {
			$this->response(array("status" => "success", "data" => $checkEmail));
		} else {
			$this->response(array("status" => "failed"));
		}
	}

	/**
	 * Used to update the user with the new password.
	 * It is required that the post contains a token which must be present in the database
	 */
	public function passwordForget_post()
	{
		$email = $this->post("email");
		$password = sha1($this->post("password"));
		$token = $this->post("token");
		if ($email) {
			$checkUser = $this->db->query("select * from user where email = '$email' and passwordResetToken='$token'")->row();
			if ($checkUser) {
				$data = array();
				$data['password'] = $password;
				$data['passwordChanged'] = "yes";
				$data['originalPassword'] = $this->post("password");
				$data['passwordReset'] = 'yes';
				$data['passwordResetToken'] = '';
				$data['passwordResetDate'] = '';
				$this->db->update("user", $data, array("email" => $email));

				$checkUserAgain = $this->db->query("select * from user where email = '$email'")->row();
				$this->response(array("status" => "success", "data" => $checkUserAgain, "message" => "Adgangskoden blev ændret", "request_status" => REST_Controller::HTTP_OK));
			}
		} else {
			$this->response(array("status" => "failed"));
		}
	}

	/**
	 * Get the email credentials used for connectivity to the mail server
	 */
	public function smtpCredentials_get()
	{
		$rowData = $this->db->query("select * from settings where Id='1'")->row();
		$this->response(array("status" => "success", "data" => $rowData));
	}

	/**
	 * Create/update the email credentials used for connectivity to the mail server
	 */
	public function smtpCredentials_post()
	{
		$email = $this->post("email");
		$password = $this->post("password");
		$host = $this->post("host");
		$port = $this->post("port");

		$d1 = array();

		$d1['password'] = $password;
		$d1['email'] = $email;
		$d1['host'] = $host;
		$d1['port'] = $port;

		$this->db->update("settings", $d1, array("Id", '1'));

		$this->response(array("status" => "success"));
	}
}
