from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum
import google.generativeai as genai
import google.ai.generativelanguage as glm
import os
import uvicorn
import json
import requests
from dotenv import load_dotenv
import re
# Load environment variables
load_dotenv()

# Định nghĩa tools cho chatbot
tools = [
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="create_message",
                description="Tạo tin nhắn mới trong cuộc trò chuyện. Nếu chưa có chat_id, hệ thống sẽ tự động tạo một cuộc trò chuyện mới.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "content": glm.Schema(
                            type=glm.Type.STRING,
                            description="Nội dung tin nhắn cần gửi"
                        ),
                        "sender": glm.Schema(
                            type=glm.Type.STRING,
                            description="Người gửi tin nhắn (USER hoặc BOT)"
                        ),
                        "chatId": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="ID của cuộc trò chuyện. Nếu không có, hệ thống sẽ tạo mới"
                        )
                    },
                    required=["content", "sender"]
                )
            )
        ]
    ),
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="find_messages",
                description="Tìm kiếm và lấy danh sách tin nhắn trong một cuộc trò chuyện cụ thể, có phân trang.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "chatId": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="ID của cuộc trò chuyện cần tìm kiếm tin nhắn"
                        ),
                        "page": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số trang cần lấy (mặc định là 1)"
                        ),
                        "limit": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số lượng tin nhắn tối đa trên mỗi trang (mặc định là 10)"
                        )
                    },
                    required=["chatId"]
                )
            )
        ]
    ),
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="history_messages",
                description="Lấy lịch sử tin nhắn của một cuộc trò chuyện, được định dạng đặc biệt cho việc hiển thị lịch sử chat.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "chatId": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="ID của cuộc trò chuyện cần lấy lịch sử"
                        ),
                        "page": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số trang cần lấy (mặc định là 1)"
                        ),
                        "limit": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số lượng tin nhắn tối đa trên mỗi trang (mặc định là 20)"
                        )
                    },
                    required=["chatId"]
                )
            )
        ]
    ),
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="find_classes",
                description="Tìm kiếm và lấy danh sách các lớp học với các bộ lọc khác nhau. Tất cả các tham số đều tùy chọn.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "name": glm.Schema(
                            type=glm.Type.STRING,
                            description="Tên lớp học cần tìm kiếm (tìm kiếm mờ)"
                        ),
                        "status": glm.Schema(
                            type=glm.Type.STRING,
                            description="Trạng thái của lớp học (ACTIVE, INACTIVE, etc.)"
                        ),
                        "page": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số trang cần lấy (mặc định là 1)"
                        ),
                        "rowPerPage": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Số lượng lớp học tối đa trên mỗi trang (mặc định là 10)"
                        ),
                        "learningDate": glm.Schema(
                            type=glm.Type.STRING,
                            description="Ngày học cụ thể để lọc (format: YYYY-MM-DD)"
                        ),
                        "month": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Tháng cần lấy lịch học (1-12)"
                        ),
                        "year": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="Năm cần lấy lịch học"
                        )
                    }
                )
            )
        ]
    ),
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="create_student",
                description="Tạo học sinh mới và gán vào lớp học. Yêu cầu quyền ADMIN hoặc TA với permission CREATE_STUDENT.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "name": glm.Schema(
                            type=glm.Type.STRING,
                            description="Tên học sinh"
                        ),
                        "classId": glm.Schema(
                            type=glm.Type.INTEGER,
                            description="ID của lớp học mà học sinh sẽ được gán vào"
                        ),
                        "dob": glm.Schema(
                            type=glm.Type.STRING,
                            description="Ngày sinh của học sinh (định dạng YYYY-MM-DD)"
                        ),
                        "parent": glm.Schema(
                            type=glm.Type.STRING,
                            description="Tên phụ huynh của học sinh"
                        ),
                        "phoneNumber": glm.Schema(
                            type=glm.Type.STRING,
                            description="Số điện thoại chính của học sinh"
                        ),
                        "secondPhoneNumber": glm.Schema(
                            type=glm.Type.STRING,
                            description="Số điện thoại phụ của học sinh (tùy chọn)"
                        )
                    },
                    required=["name", "classId", "dob", "parent", "phoneNumber"]
                )
            )
        ]
    ),
    glm.Tool(
        function_declarations=[
            glm.FunctionDeclaration(
                name="create_class",
                description="Tạo lớp học mới. Yêu cầu quyền ADMIN.",
                parameters=glm.Schema(
                    type=glm.Type.OBJECT,
                    properties={
                        "name": glm.Schema(
                            type=glm.Type.STRING,
                            description="Tên lớp học"
                        ),
                        "description": glm.Schema(
                            type=glm.Type.STRING,
                            description="Mô tả lớp học"
                        ),
                        "status": glm.Schema(
                            type=glm.Type.STRING,
                            description="Trạng thái lớp học (ACTIVE hoặc INACTIVE)",
                            enum=["ACTIVE", "INACTIVE"]
                        ),
                        "sessions": glm.Schema(
                            type=glm.Type.ARRAY,
                            description="Danh sách các buổi học của lớp",
                            items=glm.Schema(
                                type=glm.Type.OBJECT,
                                properties={
                                    "sessionKey": glm.Schema(
                                        type=glm.Type.STRING,
                                        description="Mã buổi học (SESSION_1 đến SESSION_7, tương ứng với thứ 2 đến chủ nhật)",
                                        enum=["SESSION_1", "SESSION_2", "SESSION_3", "SESSION_4", "SESSION_5", "SESSION_6", "SESSION_7"]
                                    ),
                                    "startTime": glm.Schema(
                                        type=glm.Type.STRING,
                                        description="Thời gian bắt đầu (định dạng HH:mm)"
                                    ),
                                    "endTime": glm.Schema(
                                        type=glm.Type.STRING,
                                        description="Thời gian kết thúc (định dạng HH:mm)"
                                    ),
                                    "amount": glm.Schema(
                                        type=glm.Type.NUMBER,
                                        description="Học phí cho buổi học"
                                    )
                                },
                                required=["sessionKey", "startTime", "endTime", "amount"]
                            )
                        )
                    },
                    required=["name", "status", "sessions"]
                )
            )
        ]
    )
]

# Configure Gemini
genai.configure(api_key=os.getenv("API_KEY"))
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-preview-04-17",
    tools=tools
)

# Initialize FastAPI
app = FastAPI(title="School Management Chatbot")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3015"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Base URL for backend
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3010")


# =========================
# ======= Models ==========
# =========================

class Sender(str, Enum):
    USER = "USER"
    BOT = "BOT"

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    chat_id: Optional[int] = None  # Thêm chat_id để lưu tin nhắn vào chat cụ thể

class ChatResponse(BaseModel):
    response: str
    data: Optional[Dict[str, Any]] = None


# =========================
# ===== Helper Func =======
# =========================

def get_headers(token: Optional[str] = None) -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"  # để backend dùng nếu muốn
    return headers

def call_backend_api(endpoint: str, method: str, data: Dict[str, Any], token: Optional[str] = None) -> Dict[str, Any]:
    """Gọi API đến backend"""
    try:
        url = f"{BACKEND_URL}{endpoint}"
        headers = get_headers(token)
        cookies = {"Authentication": token} if token else {}

        print(cookies, "cookies")

        if method.upper() == "POST":
            response = requests.post(url, headers=headers, cookies=cookies, json=data)
        elif method.upper() == "GET":
            response = requests.get(url, headers=headers, cookies=cookies, params=data)
        else:
            raise HTTPException(status_code=400, detail="Method not supported")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Backend API error: {str(e)}")

def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract token from Bearer authorization header"""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return token
    except ValueError:
        return None

def evaluate_api_response(api_calls: list, api_responses: list, last_response: dict, is_confirmation: bool = False) -> str:
    """Đánh giá kết quả từ API calls và tạo message phù hợp"""
    try:
        # Tạo prompt cho Gemini để đánh giá kết quả
        prompt = f"""
        System: Bạn là một trợ lý thông minh, nhiệm vụ của bạn là đánh giá kết quả từ các API calls và tạo ra một thông điệp thân thiện, dễ hiểu cho người dùng.
        
        Dưới đây là thông tin về các API calls đã thực hiện và kết quả của chúng:
        
        API Calls:
        {json.dumps(api_calls, indent=2, ensure_ascii=False)}
        
        API Responses:
        {json.dumps(api_responses, indent=2, ensure_ascii=False)}
        
        {'Đây là yêu cầu trực tiếp từ người dùng, hãy tạo thông điệp ngắn gọn xác nhận hành động đã hoàn thành.' if is_confirmation else 'Hãy tạo một thông điệp phản hồi thân thiện dựa trên kết quả này. Thông điệp nên:\n1. Xác nhận hành động đã thực hiện thành công\n2. Tóm tắt thông tin quan trọng từ kết quả\n3. Sử dụng ngôn ngữ tự nhiên, thân thiện\n4. Không đề cập đến các chi tiết kỹ thuật như API calls'}
        
        Chỉ trả về thông điệp, không cần thêm bất kỳ giải thích hay format nào khác.
        """
        
        # Gọi Gemini để tạo message
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        # Nếu có lỗi trong quá trình đánh giá, trả về message mặc định
        return "Tôi đã hoàn thành yêu cầu của bạn. Bạn có cần tôi giúp gì thêm không?"

async def save_message(content: str, sender: Sender, chat_id: Optional[int] = None, token: Optional[str] = None) -> Dict[str, Any]:
    """Lưu tin nhắn vào database"""
    try:
        # Kiểm tra token
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )

        # Chuẩn bị data để tạo tin nhắn
        data = {
            "content": content,
            "sender": sender.value,
        }
        
        # Chỉ thêm chatId nếu có chat_id
        if chat_id:
            data["chatId"] = chat_id

        # Tạo tin nhắn mới
        try:
            response = call_backend_api(
                endpoint="/messages/create",
                method="POST",
                data=data,
                token=token
            )
            return response
        except requests.exceptions.HTTPError as api_error:
            if hasattr(api_error, 'response'):
                status_code = api_error.response.status_code
                error_detail = api_error.response.text
                
                # Xử lý lỗi xác thực
                if status_code == 401:
                    raise HTTPException(
                        status_code=401,
                        detail="Authentication failed or token expired"
                    )
                # Xử lý các lỗi khác
                raise HTTPException(
                    status_code=status_code,
                    detail=f"Backend API error: {error_detail}"
                )
            raise HTTPException(
                status_code=500,
                detail=f"Backend API error: {str(api_error)}"
            )

    except HTTPException as http_error:
        # Re-raise HTTP exceptions
        raise http_error
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

def convert_proto_to_dict(obj):
    """Convert protobuf objects to Python dict"""
    if hasattr(obj, 'items'):  # For MapComposite
        return {k: convert_proto_to_dict(v) for k, v in obj.items()}
    elif hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes)):  # For RepeatedComposite
        return [convert_proto_to_dict(item) for item in obj]
    else:
        return obj

async def execute_tool(tool_name: str, tool_args: Dict[str, Any], token: str) -> Dict[str, Any]:
    """Thực thi tool dựa trên tên và tham số"""
    try:
        # Convert protobuf objects to Python dict
        converted_args = convert_proto_to_dict(tool_args)
        
        # Add detailed logging
        print("\n=== Tool Execution Details ===")
        print(f"Tool Name: {tool_name}")
        print("Original Tool Arguments:", tool_args)
        print("Converted Tool Arguments:")
        print(json.dumps(converted_args, indent=2, ensure_ascii=False))
        print("===========================\n")

        try:
            if tool_name == "create_message":
                response = await save_message(
                    content=converted_args["content"],
                    sender=Sender(converted_args["sender"]),
                    chat_id=converted_args.get("chatId"),
                    token=token
                )
                print("create_message response:", response)
                return response
            elif tool_name == "find_messages":
                response = call_backend_api(
                    endpoint="/messages/find-messages",
                    method="POST",
                    data=converted_args,
                    token=token
                )
                print("find_messages response:", response)
                return response
            elif tool_name == "history_messages":
                response = call_backend_api(
                    endpoint="/messages/history-messages",
                    method="POST",
                    data=converted_args,
                    token=token
                )
                print("history_messages response:", response)
                return response
            elif tool_name == "find_classes":
                converted_args["fetchAll"] = True
                
                if "month" in converted_args and "year" in converted_args:
                    response = call_backend_api(
                        endpoint="/classes/calendar",
                        method="POST",
                        data=converted_args,
                        token=token
                    )
                else:
                    response = call_backend_api(
                        endpoint="/classes/find-classes",
                        method="POST",
                        data=converted_args,
                        token=token
                    )
                print("find_classes response:", response)
                return response
            elif tool_name == "create_student":
                response = call_backend_api(
                    endpoint="/students/create",
                    method="POST",
                    data=converted_args,
                    token=token
                )
                print("create_student response:", response)
                return response
            elif tool_name == "create_class":
                # Validate required fields
                required_fields = ["name", "status", "sessions"]
                for field in required_fields:
                    if field not in converted_args:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Missing required field: {field}"
                        )
                
                # Validate sessions
                for session in converted_args["sessions"]:
                    session_required = ["sessionKey", "startTime", "endTime", "amount"]
                    for field in session_required:
                        if field not in session:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Missing required field in session: {field}"
                            )
                    
                    # Validate sessionKey
                    valid_session_keys = ["SESSION_1", "SESSION_2", "SESSION_3", "SESSION_4", "SESSION_5", "SESSION_6", "SESSION_7"]
                    if session["sessionKey"] not in valid_session_keys:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid sessionKey: {session['sessionKey']}. Must be one of {valid_session_keys}"
                        )
                    
                    # Validate time format
                    time_pattern = r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    if not re.match(time_pattern, session["startTime"]) or not re.match(time_pattern, session["endTime"]):
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid time format. Use HH:mm format (e.g., 08:30)"
                        )
                    
                    # Validate amount is positive
                    if session["amount"] <= 0:
                        raise HTTPException(
                            status_code=400,
                            detail="Amount must be greater than 0"
                        )

                try:
                    response = call_backend_api(
                        endpoint="/classes/create",
                        method="POST",
                        data=converted_args,
                        token=token
                    )
                    print("create_class response:", response)
                    return response
                except Exception as e:
                    print("Error in create_class API call:", str(e))
                    raise
            else:
                raise HTTPException(status_code=400, detail=f"Tool {tool_name} không được hỗ trợ")
        except Exception as e:
            print(f"Error executing {tool_name}:", str(e))
            raise

    except Exception as e:
        print(f"Error in execute_tool for {tool_name}:", str(e))
        raise HTTPException(status_code=500, detail=f"Lỗi khi thực thi tool {tool_name}: {str(e)}")

# =========================
# ======= Chat API ========
# =========================

def try_parse_tool_from_text(text: str):
    """Parse tool_call từ chuỗi JSON dạng markdown codeblock."""
    try:
        # Loại bỏ markdown ```json ... ```
        clean_text = re.sub(r"^```json\n|```$", "", text.strip())
        data = json.loads(clean_text)

        # Giả định định dạng đúng là {"parts": [{"function_call": {...}}]}
        part = data["parts"][0]
        if "function_call" in part:
            return part["function_call"]
    except Exception as e:
        pass
    return None

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """Endpoint xử lý chat với người dùng"""
    try:
        token = authorization.split(" ")[1] if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # Khởi tạo biến theo dõi
        api_calls = []
        api_responses = []
        process_query = True
        function_call_count = 0

        try:
            # Khởi tạo danh sách tin nhắn
            messages = [
                glm.Content(
                    role="user",
                    parts=[glm.Part(text=request.message)]
                )
            ]
            
            # Đọc system prompt
            with open("prompts/system_prompt.txt", "r", encoding="utf-8") as f:
                system_prompt = f.read()

            # Tạo prompt cho Gemini với tools
            prompt = f"""
            System: {system_prompt}
            
            User: {request.message}
            
            Assistant: Vui lòng phản hồi yêu cầu của người dùng một cách hữu ích và thân thiện.
            """

            # Cấu hình generation
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 2048,
            }

            response = model.generate_content(
                contents=[{"parts": [{"text": prompt}]}],
                generation_config=generation_config,
            )

            print("Initial response:", response)

            final_response = None

            # Bắt đầu xử lý loop
            while process_query:
                try:
                    assistant_content = []
                    has_function_call = False

                    for content in response.candidates[0].content.parts:
                        try:
                            # ✅ ƯU TIÊN function_call nếu có
                            if hasattr(content, 'function_call') and content.function_call:
                                has_function_call = True
                                function_call_count += 1
                                tool_call = content.function_call
                                print(f"Function call #{function_call_count}: {tool_call.name}")

                                try:
                                    args_dict = dict(tool_call.args)
                                    print("Function call args:", args_dict)
                                    result = await execute_tool(tool_call.name, args_dict, token)
                                    print("Function call result:", result)
                                    
                                    api_calls.append({
                                        "tool": tool_call.name,
                                        "args": args_dict
                                    })
                                    api_responses.append(result)

                                    messages.append(
                                        glm.Content(
                                            role="assistant",
                                            parts=[glm.Part(
                                                function_call=glm.FunctionCall(
                                                    name=tool_call.name,
                                                    args=args_dict
                                                )
                                            )]
                                        )
                                    )

                                    messages.append(
                                        glm.Content(
                                            role="user",
                                            parts=[glm.Part(
                                                function_response=glm.FunctionResponse(
                                                    name=tool_call.name,
                                                    response={"content": result}
                                                )
                                            )]
                                        )
                                    )

                                except Exception as e:
                                    print(f"Error executing tool {tool_call.name}:", str(e))
                                    raise

                            elif content.text:
                                # ✨ Thử parse text thành tool_call JSON
                                tool_call_raw = try_parse_tool_from_text(content.text)

                                if tool_call_raw:
                                    has_function_call = True
                                    function_call_count += 1
                                    print(f"Function call #{function_call_count} (from text): {tool_call_raw['name']}")

                                    try:
                                        tool_call = glm.FunctionCall(
                                            name=tool_call_raw["name"],
                                            args=tool_call_raw["args"]
                                        )

                                        args_dict = dict(tool_call.args)
                                        print("Function call args (from text):", args_dict)
                                        result = await execute_tool(tool_call.name, args_dict, token)
                                        print("Function call result (from text):", result)

                                        api_calls.append({
                                            "tool": tool_call.name,
                                            "args": args_dict
                                        })
                                        api_responses.append(result)

                                        messages.append(
                                            glm.Content(
                                                role="assistant",
                                                parts=[glm.Part(function_call=tool_call)]
                                            )
                                        )

                                        messages.append(
                                            glm.Content(
                                                role="user",
                                                parts=[glm.Part(
                                                    function_response=glm.FunctionResponse(
                                                        name=tool_call.name,
                                                        response={"content": result}
                                                    )
                                                )]
                                            )
                                        )

                                    except Exception as e:
                                        print(f"Error executing tool {tool_call_raw['name']} (from text):", str(e))
                                        raise

                                else:
                                    assistant_content.append({"type": "text", "text": content.text})

                        except Exception as e:
                            print(f"Error processing content part:", str(e))
                            raise

                    if has_function_call:
                        try:
                            response = model.generate_content(
                                contents=messages,
                                generation_config=generation_config,
                            )
                            print("New response in loop:", response)
                        except Exception as e:
                            print("Error generating new response:", str(e))
                            raise
                    else:
                        final_response = next((item["text"] for item in assistant_content if item["type"] == "text"), None)
                        process_query = False

                except Exception as e:
                    print("Error in process_query loop:", str(e))
                    raise

            # ✅ Trả về kết quả cuối
            response_text = final_response or "Xin lỗi, tôi chưa thể xử lý yêu cầu của bạn."

            # Đánh giá API responses và tạo message phù hợp
            if api_calls and api_responses:
                evaluated_response = evaluate_api_response(
                    api_calls=api_calls,
                    api_responses=api_responses,
                    last_response={"text": response_text},
                    is_confirmation=any(call["tool"] in ["create_student", "create_class", "create_message"] for call in api_calls)
                )
                response_text = evaluated_response

            # ✅ FIX
            return ChatResponse(
                response=response_text,
                data={
                    "api_calls": convert_proto_to_dict(api_calls),
                    "api_responses": convert_proto_to_dict(api_responses),
                    "function_call_count": function_call_count
                }
            )


        except Exception as e:
            print("Error in chat processing:", str(e))
            raise HTTPException(
                status_code=500,
                detail=f"Error processing chat: {str(e)}"
            )

    except HTTPException as http_error:
        print("HTTP Exception:", str(http_error))
        raise http_error
    except Exception as e:
        print("Unexpected error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

# =========================
# ====== Run Server =======
# =========================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)